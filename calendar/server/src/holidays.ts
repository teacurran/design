const date: Date = new Date();
const year = date.getFullYear();

const personalHolidays = [
    {
        name: 'Sarah\'s Birthday',
        date: new Date(year, 3, 18),
        emoji: '🎂'
    },
    {
        name: 'Terrence\'s Birthday',
        date: new Date(year, 5, 2),
        emoji: '🎂'
    },
    {
        name: 'Our Anniversary',
        date: new Date(year, 9, 22),
        emoji: '💒'
    }
];

const federalHolidays = [
    {
        name: 'New Year\'s Day',
        date: new Date(year, 0, 1),
        emoji: '🎉'
    },
    {
        name: 'Martin Luther King Jr. Day',
        date: new Date(year, 0, 20),
        emoji: '👑'
    },
    {
        name: 'Presidents Day',
        date: new Date(year, 1, 17),
        emoji: '🇺🇸'
    },
    {
        name: 'Memorial Day',
        date: new Date(year, 4, 25),
        emoji: '🌹'
    },
    {
        name: 'Independence Day',
        date: new Date(year, 6, 4),
        emoji: '🎆'
    },
    {
        name: 'Veterans Day',
        date: new Date(year, 10, 11),
        emoji: '🇺🇸'
    },
    {
        name: 'Thanksgiving Day',
        date: new Date(year, 10, 28),
        emoji: '🦃'
    },
    {
        name: 'Christmas Day',
        date: new Date(year, 11, 25),
        emoji: '🎄'
    }
];

const canadianHolidays = [
    {
        name: 'Canada Day',
        date: new Date(year, 6, 1),
        emoji: '🇨🇦'
    },
    {
        name: 'Victoria Day',
        date: new Date(year, 4, 18),
        emoji: '🇨🇦'
    },
    {
        name: 'Canada Day',
        date: new Date(year, 6, 1),
        emoji: '🇨🇦'
    },
    {
        name: 'Remembrance Day',
        date: new Date(year, 10, 11),
        emoji: '🇨🇦'
    },
    {
        name: 'Thanksgiving Day',
        date: new Date(year, 9, 14),
        emoji: '🇨🇦🦃'
    },
    {
        name: 'Boxing Day',
        date: new Date(year, 11, 26),
        emoji: '🎁'
    }
];

const otherHolidays = [
    {
        name: 'Valentines Day',
        date: new Date(year, 1, 14),
        emoji: '💘'
    },
    {
        name: 'St. Patrick\'s Day',
        date: new Date(year, 2, 17),
        emoji: '🍀'
    },
    {
        name: 'Earth Day',
        date: new Date(year, 3, 22),
        emoji: '🌍'
    },
    {
        name: 'April Fools Day',
        date: new Date(year, 3, 1),
        emoji: '🤡'
    },
    {
        name: 'May Day',
        date: new Date(year, 4, 1),
        emoji: '🌷'
    },
    {
        name: 'Cinco de Mayo',
        date: new Date(year, 4, 5),
        emoji: '🇲🇽'
    },
    {
        name: 'Labor Day',
        date: new Date(year, 8, 2),
        emoji: '👷'
    },
    {
        name: 'Halloween',
        date: new Date(year, 9, 31),
        emoji: '🎃'
    },
    {
        name: 'Election Day',
        date: new Date(year, 10, 3),
        emoji: '🗳️'
    },
    {
        name: 'Black Friday',
        date: new Date(year, 10, 29),
        emoji: '🛍️'
    },
    {
        name: 'Cyber Monday',
        date: new Date(year, 11, 2),
        emoji: '💻'
    },
    {
        name: 'New Year\'s Eve',
        date: new Date(year, 11, 31),
        emoji: '🎆'
    }
];

const catholicHolidays = [
    {
        name: 'Ash Wednesday',
        date: new Date(year, 1, 26),
        emoji: '⛪'
    },
    {
        name: 'Palm Sunday',
        date: new Date(year, 3, 5),
        emoji: '🌿'
    },
    {
        name: 'Good Friday',
        date: new Date(year, 3, 10),
        emoji: '✝️'
    },
    {
        name: 'Easter Sunday',
        date: new Date(year, 3, 12),
        emoji: '🐰'
    },
    {
        name: 'All Saints Day',
        date: new Date(year, 10, 1),
        emoji: '👼'
    },
    {
        name: 'Christmas Eve',
        date: new Date(year, 11, 24),
        emoji: '🎄'
    }
];

const jewishHolidays = [
    {
        name: 'Passover',
        date: new Date(year, 3, 8),
        emoji: '🍷'
    },
    {
        name: 'Purim',
        date: new Date(year, 2, 10),
        emoji: '🎭'
    },
    {
        name: 'Rosh Hashanah',
        date: new Date(year, 8, 30),
        emoji: '🍎'
    },
    {
        name: 'Yom Kippur',
        date: new Date(year, 9, 9),
        emoji: '🕍'
    },
    {
        name: 'Hanukkah',
        date: new Date(year, 11, 22),
        emoji: '🕎'
    },
];

const hinduHolidays = [
    {
        name: 'Republic Day',
        date: new Date(year, 0, 26),
        emoji: '🇮🇳'
    },
    {
        name: 'Independence Day',
        date: new Date(year, 7, 15),
        emoji: '🇮🇳'
    },
    {
        name: 'Diwali',
        date: new Date(year, 10, 14),
        emoji: '🪔'
    },
    {
        name: 'Holi',
        date: new Date(year, 2, 9),
        emoji: '🎨'
    },
    {
        name: 'Raksha Bandhan',
        date: new Date(year, 7, 3),
        emoji: '👫'
    },
    {
        name: 'Ganesh Chaturthi',
        date: new Date(year, 8, 2),
        emoji: '🐘'
    },
    {
        name: 'Navaratri',
        date: new Date(year, 9, 29),
        emoji: '🎉'
    },
    {
        name: 'Makar Sankranti',
        date: new Date(year, 0, 14),
        emoji: '🪁'
    }
];

const islamicHolidays = [
    {
        name: 'Eid al-Fitr',
        date: new Date(year, 4, 24),
        emoji: '🌙'
    },
    {
        name: 'Eid al-Adha',
        date: new Date(year, 7, 31),
        emoji: '🐑'
    },
    {
        name: 'Mawlid al-Nabi',
        date: new Date(year, 2, 8),
        emoji: '🕌'
    }
];

const chineseHolidays = [
    {
        name: 'Chinese New Year',
        date: new Date(year, 0, 25),
        emoji: '🧧'
    },
    {
        name: 'Mid-Autumn Festival',
        date: new Date(year, 8, 13),
        emoji: '🥮'
    },
    {
        name: 'Dragon Boat Festival',
        date: new Date(year, 5, 7),
        emoji: '🐉'
    }
];

export {
    personalHolidays,
    federalHolidays,
    canadianHolidays,
    otherHolidays,
    catholicHolidays,
    jewishHolidays,
    hinduHolidays,
    islamicHolidays,
    chineseHolidays
};