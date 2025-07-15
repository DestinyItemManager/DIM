const enhancedIntrinsics = new Set<number>([
  451371216, // Adaptive Burst
  1063261332, // Adaptive Burst
  1655963600, // Adaptive Burst
  3049431773, // Adaptive Burst
  4269485650, // Adaptive Burst
  31057037, // Adaptive Burst
  1795925907, // Adaptive Burst
  1938288214, // Adaptive Burst
  2503963990, // Adaptive Burst
  3387402995, // Adaptive Burst
  3414419157, // Adaptive Burst
  3576895600, // Adaptive Burst
  4193948962, // Adaptive Burst
  4200880287, // Adaptive Burst
  141515518, // Adaptive Frame
  489506521, // Adaptive Frame
  1900989425, // Adaptive Frame
  2178772051, // Adaptive Frame
  2490530085, // Adaptive Frame
  3133077199, // Adaptive Frame
  3355499393, // Adaptive Frame
  3435239180, // Adaptive Frame
  4249817697, // Adaptive Frame
  1793150018, // Adaptive Frame
  378204240, // Adaptive Glaive
  1338909520, // Adaptive Glaive
  1447716563, // Adaptive Glaive
  2696719570, // Adaptive Glaive
  581875391, // Aggressive Burst
  1020196213, // Aggressive Burst
  1068043187, // Aggressive Burst
  2419864979, // Aggressive Burst
  757651572, // Aggressive Frame
  2662827496, // Aggressive Frame
  3615521782, // Aggressive Frame
  4074888076, // Aggressive Frame
  1069611115, // Aggressive Frame
  1361856293, // Aggressive Frame
  1739861752, // Aggressive Frame
  1748364716, // Aggressive Frame
  1831499663, // Aggressive Frame
  2059481925, // Aggressive Frame
  2097693203, // Aggressive Frame
  2101490074, // Aggressive Frame
  2912509910, // Aggressive Frame
  3794558792, // Aggressive Frame
  4036525828, // Aggressive Frame
  4198833635, // Aggressive Frame
  4203236451, // Aggressive Frame
  1749118639, // Aggressive Frame
  2159352803, // Aggressive Frame
  2552875793, // Aggressive Frame
  3320257055, // Aggressive Frame
  16021165, // Aggressive Frame
  176072987, // Aggressive Frame
  1827557644, // Aggressive Frame
  3026990487, // Aggressive Frame
  3884051579, // Aggressive Frame
  189818679, // Aggressive Frame
  389945760, // Aggressive Frame
  1487938731, // Aggressive Frame
  1632897927, // Aggressive Frame
  1737914521, // Aggressive Frame
  167794220, // Aggressive Frame
  16445399, // Aggressive Glaive
  738339367, // Aggressive Glaive
  2040155611, // Aggressive Glaive
  3228668394, // Aggressive Glaive
  244760020, // Area Denial Frame
  1208953762, // Area Denial Frame
  1782704870, // Area Denial Frame
  2012023082, // Area Denial Frame
  3035281791, // Caster Frame
  210578077, // Compressed Wave Frame
  667908513, // Compressed Wave Frame
  2264456959, // Compressed Wave Frame
  3142073525, // Compressed Wave Frame
  583593420, // Double Fire
  650063316, // Double Fire
  983290038, // Double Fire
  3755958904, // Double Fire
  570373697, // Heavy Burst
  749936529, // Heavy Burst
  1370384437, // Heavy Burst
  1817649409, // Heavy Burst
  2170254329, // Heavy Burst
  2213429699, // Heavy Burst
  2444870733, // Heavy Burst
  2732540911, // Heavy Burst
  3099083217, // Heavy Burst
  3291480605, // Heavy Burst
  3456918063, // Heavy Burst
  4175870265, // Heavy Burst
  302702765, // High-Impact Frame
  1451602450, // High-Impact Frame
  1472963920, // High-Impact Frame
  1875323682, // High-Impact Frame
  1946568256, // High-Impact Frame
  2516075140, // High-Impact Frame
  2617324347, // High-Impact Frame
  3769337248, // High-Impact Frame
  4231246084, // High-Impact Frame
  916649862, // Legacy PR-55 Frame
  2155015844, // Legacy PR-55 Frame
  3332480988, // Legacy PR-55 Frame
  3766386008, // Legacy PR-55 Frame
  118439741, // Lightweight Frame
  132189785, // Lightweight Frame
  885620491, // Lightweight Frame
  1665848857, // Lightweight Frame
  395096174, // Lightweight Frame
  2012877834, // Lightweight Frame
  3048420653, // Lightweight Frame
  3472640090, // Lightweight Frame
  3728676938, // Lightweight Frame
  308595185, // Lightweight Frame
  539564471, // Lightweight Frame
  956390015, // Lightweight Frame
  1671927875, // Lightweight Frame
  3272152575, // Lightweight Frame
  3377988521, // Lightweight Frame
  3725333007, // Lightweight Frame
  4008973208, // Lightweight Frame
  4080055066, // Lightweight Frame
  2105054824, // Lightweight Frame
  1057935015, // MIDA Synergy
  1891876363, // MIDA Synergy
  2470575005, // MIDA Synergy
  2670025099, // MIDA Synergy
  540070330, // Micro-Missile Frame
  745725302, // Micro-Missile Frame
  1278053348, // Micro-Missile Frame
  4024789138, // Micro-Missile Frame
  846472617, // Pinpoint Slug Frame
  878620401, // Pinpoint Slug Frame
  1714663217, // Pinpoint Slug Frame
  1966150207, // Pinpoint Slug Frame
  2410819063, // Pinpoint Slug Frame
  2426674025, // Pinpoint Slug Frame
  2897981193, // Pinpoint Slug Frame
  3260675681, // Pinpoint Slug Frame
  1827389998, // Precision Frame
  3114731754, // Precision Frame
  3252839262, // Precision Frame
  3665558569, // Precision Frame
  4000302358, // Precision Frame
  2305599261, // Precision Frame
  2458294492, // Precision Frame
  2563509458, // Precision Frame
  2725422375, // Precision Frame
  2743098132, // Precision Frame
  3046673757, // Precision Frame
  3094629643, // Precision Frame
  3274444880, // Precision Frame
  3356299403, // Precision Frame
  3489809232, // Precision Frame
  445823153, // Precision Frame
  668357349, // Precision Frame
  2094305299, // Precision Frame
  3192296481, // Precision Frame
  26177576, // Precision Frame
  797798924, // Precision Frame
  1206996986, // Precision Frame
  3646909656, // Precision Frame
  433469519, // Precision Frame
  886865893, // Precision Frame
  1034287523, // Precision Frame
  4113841443, // Precision Frame
  482158780, // Precision Frame
  738967614, // Precision Frame
  762204274, // Precision Frame
  2409208302, // Precision Frame
  2927971896, // Precision Frame
  2986718682, // Precision Frame
  3573764622, // Precision Frame
  3774850330, // Precision Frame
  224485255, // Precision Frame
  364418505, // Precision Frame
  384272571, // Precision Frame
  453527127, // Precision Frame
  743857847, // Precision Frame
  811588234, // Precision Frame
  1045795938, // Precision Frame
  1052350088, // Precision Frame
  3000852559, // Precision Frame
  3226552705, // Precision Frame
  3399947696, // Precision Frame
  3419227006, // Precision Frame
  3913106382, // Precision Frame
  680193725, // Rapid-Fire Frame
  762801111, // Rapid-Fire Frame
  872207875, // Rapid-Fire Frame
  1483339932, // Rapid-Fire Frame
  1564126489, // Rapid-Fire Frame
  2164888232, // Rapid-Fire Frame
  2806361224, // Rapid-Fire Frame
  2984571381, // Rapid-Fire Frame
  3095041770, // Rapid-Fire Frame
  3249407402, // Rapid-Fire Frame
  3478030936, // Rapid-Fire Frame
  3841661468, // Rapid-Fire Frame
  4188742693, // Rapid-Fire Frame
  137876701, // Rapid-Fire Frame
  802623077, // Rapid-Fire Frame
  1027896051, // Rapid-Fire Frame
  1497440861, // Rapid-Fire Frame
  1765356367, // Rapid-Fire Frame
  1787083609, // Rapid-Fire Frame
  1886418605, // Rapid-Fire Frame
  2003022817, // Rapid-Fire Frame
  2260949877, // Rapid-Fire Frame
  2263539715, // Rapid-Fire Frame
  2986029425, // Rapid-Fire Frame
  4116588173, // Rapid-Fire Frame
  1576423267, // Rapid-Fire Frame
  1707990417, // Rapid-Fire Frame
  1894749743, // Rapid-Fire Frame
  3688301727, // Rapid-Fire Frame
  2593449, // Rapid-Fire Glaive
  217816625, // Rapid-Fire Glaive
  694879972, // Rapid-Fire Glaive
  2479787361, // Rapid-Fire Glaive
  368110299, // Rocket-Assisted Frame
  651554065, // Rocket-Assisted Frame
  687584589, // Rocket-Assisted Frame
  1225770249, // Rocket-Assisted Frame
  2100231191, // Rocket-Assisted Frame
  3178379945, // Rocket-Assisted Frame
  156358224, // Support Frame
  840061228, // Support Frame
  1535085486, // Support Frame
  3161047604, // Support Frame
  785441979, // Support Frame
  1926141333, // Support Frame
  2491949917, // Support Frame
  2707250581, // Support Frame
  1241894699, // Together Forever
  1300107783, // Together Forever
  2826720951, // Together Forever
  3513901081, // Together Forever
  40492375, // Vortex Frame
  621911507, // Wave Frame
  1220310607, // Wave Frame
  1713394949, // Wave Frame
  3030812579, // Wave Frame
  1978306813, // Wave Sword Frame
]);

export default enhancedIntrinsics;
