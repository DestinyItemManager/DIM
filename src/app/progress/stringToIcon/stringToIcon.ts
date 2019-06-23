import stringToUnicode from './stringToUnicode.json';

export const UnicodeToSVG = {
  '\uE099': 'bow',
  '\uE100': 'auto_rifle',
  '\uE101': 'pulse_rifle',
  '\uE102': 'scout_rifle',
  '\uE103': 'hand_cannon',
  '\uE104': 'shotgun',
  '\uE105': 'sniper_rifle',
  '\uE106': 'fusion_rifle',
  '\uE107': 'smg',
  '\uE108': 'rocket_launcher',
  '\uE109': 'sidearm',
  '\uE113': 'grenade_launcher',
  '\uE138': 'beam_weapon',
  '\uE142': 'headshot',
  '\uE140': 'damage_solar',
  '\uE143': 'damage_arc',
  '\uE144': 'damage_void',
  '\uE152': 'wire_rifle',
  '\uE153': 'sword_heavy',
  '\uE154': 'machinegun'
};

export const substringToUnicode = {};
export const substringToSVG = {};

const zh = false; // state.settings.language.startsWith('zh')

const progress = {};

Object.keys(stringToUnicode).forEach((key) => {
  const hash = stringToUnicode[key].objectiveHash;
  const substring = progress[hash].progressDescription;
  const start = progress[hash].progressDescription.indexOf('[');
  const stop = progress[hash].progressDescription.indexOf(']') + 1;
  stringToUnicode[key].substring = zh ? substring[0] : substring.substring(start, stop);
  substringToUnicode[stringToUnicode[key].substring] = stringToUnicode[key].unicode;
  substringToSVG[stringToUnicode[key].substring] = stringToUnicode[key].icon;
});
