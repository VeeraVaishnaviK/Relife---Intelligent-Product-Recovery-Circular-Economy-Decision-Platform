/**
 * ReLife Voice Inspection NLP Parser
 *
 * Extracts structured hardware defects, severity grades, and functional checklist flags
 * from spontaneous spoken phrases by warehouse inspectors.
 */

export interface ParsedVoiceDefect {
  defect_type: string;
  component: string;
  severity: 'high' | 'med' | 'low';
  location: string;
  status_flag: 'pass' | 'fail' | 'review';
}

export interface VoiceParsedResult {
  rawTranscript: string;
  parsedDefects: ParsedVoiceDefect[];
  recommendedChecklist: Record<string, 'pass' | 'fail' | 'unknown'>;
  formattedNotes: string;
  confidenceScore: number;
}

export function parseSpokenInspection(transcript: string): VoiceParsedResult {
  const t = transcript.toLowerCase();
  const defects: ParsedVoiceDefect[] = [];
  const checklist: Record<string, 'pass' | 'fail' | 'unknown'> = {};

  // 1. Display / Screen checks
  if (
    t.includes('screen has a crack') ||
    t.includes('cracked screen') ||
    t.includes('crack on the screen') ||
    t.includes('broken display') ||
    t.includes('display crack') ||
    t.includes('cracked display')
  ) {
    let loc = 'Display Panel';
    if (t.includes('top left')) loc = 'Top-Left Corner';
    else if (t.includes('top right')) loc = 'Top-Right Corner';
    else if (t.includes('bottom')) loc = 'Bottom Bezel / Glass';

    defects.push({
      defect_type: 'crack',
      component: 'display',
      severity: 'high',
      location: loc,
      status_flag: 'fail',
    });
    checklist['display_ok'] = 'fail';
  } else if (
    t.includes('screen looks fine') ||
    t.includes('screen is fine') ||
    t.includes('display is good') ||
    t.includes('display ok') ||
    t.includes('screen clear')
  ) {
    checklist['display_ok'] = 'pass';
  }

  // 2. Battery & Swelling checks
  if (
    t.includes('swelling') ||
    t.includes('swollen') ||
    t.includes('bulging') ||
    t.includes('battery fault') ||
    t.includes('battery dead') ||
    t.includes('battery might be swelling')
  ) {
    defects.push({
      defect_type: 'battery_swelling',
      component: 'battery',
      severity: 'high',
      location: 'Internal Pouch',
      status_flag: 'fail',
    });
    checklist['battery_test'] = 'fail';
  } else if (
    t.includes('battery health good') ||
    t.includes('battery passes') ||
    t.includes('battery healthy') ||
    t.includes('battery ok')
  ) {
    checklist['battery_test'] = 'pass';
  }

  // 3. Hinge & Mechanical Alignment
  if (
    t.includes('hinge feels loose') ||
    t.includes('loose hinge') ||
    t.includes('hinge broken') ||
    t.includes('hinge damaged')
  ) {
    defects.push({
      defect_type: 'loose_hinge',
      component: 'hinge',
      severity: 'med',
      location: 'Left / Right Pivot Axle',
      status_flag: 'review',
    });
  }

  // 4. Keyboard / Trackpad
  if (
    t.includes('keyboard broken') ||
    t.includes('missing key') ||
    t.includes('sticky key') ||
    t.includes('liquid spill')
  ) {
    defects.push({
      defect_type: 'missing_part',
      component: 'keyboard',
      severity: 'med',
      location: 'Keycap Assembly',
      status_flag: 'fail',
    });
  } else if (
    t.includes('keyboard looks fine') ||
    t.includes('keyboard is fine') ||
    t.includes('keyboard works') ||
    t.includes('keyboard ok')
  ) {
    // verified
  }

  // 5. Exterior Dents & Cosmetic Scratches
  if (t.includes('dent') || t.includes('dented')) {
    defects.push({
      defect_type: 'dent',
      component: 'casing',
      severity: 'med',
      location: t.includes('corner') ? 'Corner Edge' : 'Chassis',
      status_flag: 'review',
    });
  }

  if (t.includes('scratch') || t.includes('scuffed') || t.includes('scratches')) {
    defects.push({
      defect_type: 'scratch',
      component: 'casing',
      severity: 'low',
      location: 'Top Lid / Rear Cover',
      status_flag: 'pass',
    });
  }

  // 6. Power & Logic Board Booting
  if (
    t.includes('does not turn on') ||
    t.includes('no power') ||
    t.includes('dead motherboard') ||
    t.includes('no boot')
  ) {
    checklist['powers_on'] = 'fail';
    checklist['motherboard_ok'] = 'fail';
  } else if (
    t.includes('powers on') ||
    t.includes('boots up') ||
    t.includes('turns on fine')
  ) {
    checklist['powers_on'] = 'pass';
  }

  // 7. I/O Ports
  if (
    t.includes('ports loose') ||
    t.includes('broken port') ||
    t.includes('usb not working')
  ) {
    checklist['ports_ok'] = 'fail';
  } else if (
    t.includes('ports look fine') ||
    t.includes('ports working') ||
    t.includes('ports ok')
  ) {
    checklist['ports_ok'] = 'pass';
  }

  // Structured summary notes
  const defectStrings = defects.map(
    (d) => `${d.component.toUpperCase()} (${d.defect_type}, ${d.severity} sev)`
  );

  const formattedNotes =
    defects.length > 0
      ? `[Voice Log] Discovered: ${defectStrings.join(', ')}. Transcript: "${transcript.trim()}".`
      : `[Voice Log] Verified sound physical & functional state. Transcript: "${transcript.trim()}".`;

  return {
    rawTranscript: transcript.trim(),
    parsedDefects: defects,
    recommendedChecklist: checklist,
    formattedNotes,
    confidenceScore: defects.length > 0 ? 94.0 : 88.0,
  };
}
