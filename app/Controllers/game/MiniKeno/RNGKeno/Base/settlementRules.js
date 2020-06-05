const full = Object.entries({
  big: (totalPoints) => totalPoints >= 811,
  small: (totalPoints) => totalPoints <= 810,
  odd: (totalPoints) => totalPoints % 2 === 1,
  even: (totalPoints) => totalPoints % 2 === 0,
  gold: (totalPoints) => 210 <= totalPoints && totalPoints <= 695,
  wood: (totalPoints) => 696 <= totalPoints && totalPoints <= 763,
  water: (totalPoints) => 764 <= totalPoints && totalPoints <= 855,
  fire: (totalPoints) => 856 <= totalPoints && totalPoints <= 923,
  earth: (totalPoints) => 924 <= totalPoints && totalPoints <= 1410,
});

const mini = Object.entries({
  big: (totalPoints) => totalPoints >= 206,
  small: (totalPoints) => totalPoints <= 205,
  odd: (totalPoints) => totalPoints % 2 === 1,
  even: (totalPoints) => totalPoints % 2 === 0,
  gold: (totalPoints) => 55 <= totalPoints && totalPoints <= 163,
  wood: (totalPoints) => 164 <= totalPoints && totalPoints <= 187,
  water: (totalPoints) => 188 <= totalPoints && totalPoints <= 222,
  fire: (totalPoints) => 223 <= totalPoints && totalPoints <= 246,
  earth: (totalPoints) => 247 <= totalPoints && totalPoints <= 355,
});

module.exports = {
  full,
  mini,
};
