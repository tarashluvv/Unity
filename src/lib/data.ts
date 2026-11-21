import { canonicalCity, canonicalCityList } from './normalizer'
import type { AppState, CityBreakdown, Region, Snapshot } from './types'

// Each city is listed once under its canonical Russian name. Kazakh/latin
// spellings still resolve to these via normalizeText() + CITY_ALIASES.
export const defaultRegions: Region[] = [
  { id: 'astana', name: 'Астана', aliases: ['г. астана', 'нур-султан', 'nursultan', 'astana'], cities: ['Астана'], minThreshold: 250 },
  { id: 'almaty', name: 'Алматы', aliases: ['г. алматы', 'almaty'], cities: ['Алматы'], minThreshold: 250 },
  { id: 'shymkent', name: 'Шымкент', aliases: ['г. шымкент', 'shymkent', 'чимкент'], cities: ['Шымкент'], minThreshold: 150 },
  { id: 'south', name: 'Юг', aliases: ['южный', 'юг регион'], cities: ['Кызылорда', 'Туркестан', 'Тараз', 'Талдыкорган'], minThreshold: 300 },
  { id: 'north', name: 'Север', aliases: ['северный', 'север регион'], cities: ['Костанай', 'Кокшетау', 'Петропавловск', 'Жезказган'], minThreshold: 300 },
  { id: 'west', name: 'Запад', aliases: ['западный', 'запад регион'], cities: ['Актау', 'Атырау', 'Актобе', 'Уральск'], minThreshold: 250 },
  { id: 'east', name: 'Восток', aliases: ['восточный', 'восток регион', 'усть каменогорск'], cities: ['Караганда', 'Павлодар', 'Семей', 'Усть-Каменогорск'], minThreshold: 250 },
]

const seedSnapshots: Snapshot[] = [
  {
    "id": "snap-auto-1",
    "createdAt": "2026-11-17T20:10:14.735Z",
    "comment": "Срез 1 (импорт Общего Кампуса)",
    "stats": [
      {
        "regionId": "astana",
        "fgCount": 928,
        "appCount": 928,
        "examCount": 928,
        "activistsCount": 441,
        "rejectedCount": 0,
        "deltaActivists": 441,
        "byCity": [
          {
            "city": "Астана",
            "fgCount": 928,
            "appCount": 928,
            "examCount": 928,
            "activistsCount": 441,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "almaty",
        "fgCount": 1237,
        "appCount": 1237,
        "examCount": 1237,
        "activistsCount": 381,
        "rejectedCount": 0,
        "deltaActivists": 381,
        "byCity": [
          {
            "city": "Алматы",
            "fgCount": 1237,
            "appCount": 1237,
            "examCount": 1237,
            "activistsCount": 381,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "shymkent",
        "fgCount": 276,
        "appCount": 276,
        "examCount": 276,
        "activistsCount": 179,
        "rejectedCount": 0,
        "deltaActivists": 179,
        "byCity": [
          {
            "city": "Шымкент",
            "fgCount": 276,
            "appCount": 276,
            "examCount": 276,
            "activistsCount": 179,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "south",
        "fgCount": 871,
        "appCount": 871,
        "examCount": 871,
        "activistsCount": 595,
        "rejectedCount": 0,
        "deltaActivists": 595,
        "byCity": [
          {
            "city": "Туркестан",
            "fgCount": 215,
            "appCount": 215,
            "examCount": 215,
            "activistsCount": 174,
            "rejectedCount": 0
          },
          {
            "city": "Тараз",
            "fgCount": 301,
            "appCount": 301,
            "examCount": 301,
            "activistsCount": 156,
            "rejectedCount": 0
          },
          {
            "city": "Талдыкорган",
            "fgCount": 128,
            "appCount": 128,
            "examCount": 128,
            "activistsCount": 101,
            "rejectedCount": 0
          },
          {
            "city": "Кызылорда",
            "fgCount": 141,
            "appCount": 141,
            "examCount": 141,
            "activistsCount": 80,
            "rejectedCount": 0
          },
          {
            "city": "Қызылорда",
            "fgCount": 67,
            "appCount": 67,
            "examCount": 67,
            "activistsCount": 65,
            "rejectedCount": 0
          },
          {
            "city": "Түркістан",
            "fgCount": 19,
            "appCount": 19,
            "examCount": 19,
            "activistsCount": 19,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "north",
        "fgCount": 1095,
        "appCount": 1095,
        "examCount": 1095,
        "activistsCount": 390,
        "rejectedCount": 0,
        "deltaActivists": 390,
        "byCity": [
          {
            "city": "Костанай",
            "fgCount": 324,
            "appCount": 324,
            "examCount": 324,
            "activistsCount": 227,
            "rejectedCount": 0
          },
          {
            "city": "Петропавловск",
            "fgCount": 363,
            "appCount": 363,
            "examCount": 363,
            "activistsCount": 75,
            "rejectedCount": 0
          },
          {
            "city": "Кокшетау",
            "fgCount": 167,
            "appCount": 167,
            "examCount": 167,
            "activistsCount": 49,
            "rejectedCount": 0
          },
          {
            "city": "Жезказган",
            "fgCount": 211,
            "appCount": 211,
            "examCount": 211,
            "activistsCount": 20,
            "rejectedCount": 0
          },
          {
            "city": "Жезқазған",
            "fgCount": 30,
            "appCount": 30,
            "examCount": 30,
            "activistsCount": 19,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "west",
        "fgCount": 590,
        "appCount": 590,
        "examCount": 590,
        "activistsCount": 258,
        "rejectedCount": 0,
        "deltaActivists": 258,
        "byCity": [
          {
            "city": "Уральск",
            "fgCount": 149,
            "appCount": 149,
            "examCount": 149,
            "activistsCount": 91,
            "rejectedCount": 0
          },
          {
            "city": "Актау",
            "fgCount": 165,
            "appCount": 165,
            "examCount": 165,
            "activistsCount": 66,
            "rejectedCount": 0
          },
          {
            "city": "Актобе",
            "fgCount": 155,
            "appCount": 155,
            "examCount": 155,
            "activistsCount": 52,
            "rejectedCount": 0
          },
          {
            "city": "Атырау",
            "fgCount": 121,
            "appCount": 121,
            "examCount": 121,
            "activistsCount": 49,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "east",
        "fgCount": 664,
        "appCount": 664,
        "examCount": 664,
        "activistsCount": 244,
        "rejectedCount": 0,
        "deltaActivists": 244,
        "byCity": [
          {
            "city": "Павлодар",
            "fgCount": 186,
            "appCount": 186,
            "examCount": 186,
            "activistsCount": 78,
            "rejectedCount": 0
          },
          {
            "city": "Караганда",
            "fgCount": 125,
            "appCount": 125,
            "examCount": 125,
            "activistsCount": 62,
            "rejectedCount": 0
          },
          {
            "city": "Усть-Каменогорск",
            "fgCount": 154,
            "appCount": 154,
            "examCount": 154,
            "activistsCount": 58,
            "rejectedCount": 0
          },
          {
            "city": "Семей",
            "fgCount": 199,
            "appCount": 199,
            "examCount": 199,
            "activistsCount": 46,
            "rejectedCount": 0
          }
        ]
      }
    ],
    "records": []
  },
  {
    "id": "snap-auto-2",
    "createdAt": "2026-11-17T21:10:14.736Z",
    "comment": "Срез 2 (уточнение статусов)",
    "stats": [
      {
        "regionId": "astana",
        "fgCount": 928,
        "appCount": 928,
        "examCount": 928,
        "activistsCount": 494,
        "rejectedCount": 0,
        "deltaActivists": 53,
        "byCity": [
          {
            "city": "Астана",
            "fgCount": 928,
            "appCount": 928,
            "examCount": 928,
            "activistsCount": 494,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "almaty",
        "fgCount": 1237,
        "appCount": 1237,
        "examCount": 1237,
        "activistsCount": 482,
        "rejectedCount": 0,
        "deltaActivists": 101,
        "byCity": [
          {
            "city": "Алматы",
            "fgCount": 1237,
            "appCount": 1237,
            "examCount": 1237,
            "activistsCount": 482,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "shymkent",
        "fgCount": 276,
        "appCount": 276,
        "examCount": 276,
        "activistsCount": 194,
        "rejectedCount": 0,
        "deltaActivists": 15,
        "byCity": [
          {
            "city": "Шымкент",
            "fgCount": 276,
            "appCount": 276,
            "examCount": 276,
            "activistsCount": 194,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "south",
        "fgCount": 871,
        "appCount": 871,
        "examCount": 871,
        "activistsCount": 624,
        "rejectedCount": 0,
        "deltaActivists": 29,
        "byCity": [
          {
            "city": "Туркестан",
            "fgCount": 215,
            "appCount": 215,
            "examCount": 215,
            "activistsCount": 178,
            "rejectedCount": 0
          },
          {
            "city": "Тараз",
            "fgCount": 301,
            "appCount": 301,
            "examCount": 301,
            "activistsCount": 170,
            "rejectedCount": 0
          },
          {
            "city": "Талдыкорган",
            "fgCount": 128,
            "appCount": 128,
            "examCount": 128,
            "activistsCount": 103,
            "rejectedCount": 0
          },
          {
            "city": "Кызылорда",
            "fgCount": 141,
            "appCount": 141,
            "examCount": 141,
            "activistsCount": 88,
            "rejectedCount": 0
          },
          {
            "city": "Қызылорда",
            "fgCount": 67,
            "appCount": 67,
            "examCount": 67,
            "activistsCount": 66,
            "rejectedCount": 0
          },
          {
            "city": "Түркістан",
            "fgCount": 19,
            "appCount": 19,
            "examCount": 19,
            "activistsCount": 19,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "north",
        "fgCount": 1095,
        "appCount": 1095,
        "examCount": 1095,
        "activistsCount": 468,
        "rejectedCount": 0,
        "deltaActivists": 78,
        "byCity": [
          {
            "city": "Костанай",
            "fgCount": 324,
            "appCount": 324,
            "examCount": 324,
            "activistsCount": 239,
            "rejectedCount": 0
          },
          {
            "city": "Петропавловск",
            "fgCount": 363,
            "appCount": 363,
            "examCount": 363,
            "activistsCount": 108,
            "rejectedCount": 0
          },
          {
            "city": "Кокшетау",
            "fgCount": 167,
            "appCount": 167,
            "examCount": 167,
            "activistsCount": 62,
            "rejectedCount": 0
          },
          {
            "city": "Жезказган",
            "fgCount": 211,
            "appCount": 211,
            "examCount": 211,
            "activistsCount": 39,
            "rejectedCount": 0
          },
          {
            "city": "Жезқазған",
            "fgCount": 30,
            "appCount": 30,
            "examCount": 30,
            "activistsCount": 20,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "west",
        "fgCount": 590,
        "appCount": 590,
        "examCount": 590,
        "activistsCount": 298,
        "rejectedCount": 0,
        "deltaActivists": 40,
        "byCity": [
          {
            "city": "Уральск",
            "fgCount": 149,
            "appCount": 149,
            "examCount": 149,
            "activistsCount": 95,
            "rejectedCount": 0
          },
          {
            "city": "Актау",
            "fgCount": 165,
            "appCount": 165,
            "examCount": 165,
            "activistsCount": 81,
            "rejectedCount": 0
          },
          {
            "city": "Актобе",
            "fgCount": 155,
            "appCount": 155,
            "examCount": 155,
            "activistsCount": 66,
            "rejectedCount": 0
          },
          {
            "city": "Атырау",
            "fgCount": 121,
            "appCount": 121,
            "examCount": 121,
            "activistsCount": 56,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "east",
        "fgCount": 664,
        "appCount": 664,
        "examCount": 664,
        "activistsCount": 287,
        "rejectedCount": 0,
        "deltaActivists": 43,
        "byCity": [
          {
            "city": "Павлодар",
            "fgCount": 186,
            "appCount": 186,
            "examCount": 186,
            "activistsCount": 89,
            "rejectedCount": 0
          },
          {
            "city": "Усть-Каменогорск",
            "fgCount": 154,
            "appCount": 154,
            "examCount": 154,
            "activistsCount": 69,
            "rejectedCount": 0
          },
          {
            "city": "Караганда",
            "fgCount": 125,
            "appCount": 125,
            "examCount": 125,
            "activistsCount": 67,
            "rejectedCount": 0
          },
          {
            "city": "Семей",
            "fgCount": 199,
            "appCount": 199,
            "examCount": 199,
            "activistsCount": 62,
            "rejectedCount": 0
          }
        ]
      }
    ],
    "records": []
  },
  {
    "id": "snap-auto-3",
    "createdAt": "2026-11-17T22:10:14.737Z",
    "comment": "Срез 3 (проверка активностей)",
    "stats": [
      {
        "regionId": "astana",
        "fgCount": 928,
        "appCount": 928,
        "examCount": 928,
        "activistsCount": 550,
        "rejectedCount": 0,
        "deltaActivists": 56,
        "byCity": [
          {
            "city": "Астана",
            "fgCount": 928,
            "appCount": 928,
            "examCount": 928,
            "activistsCount": 550,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "almaty",
        "fgCount": 1237,
        "appCount": 1237,
        "examCount": 1237,
        "activistsCount": 567,
        "rejectedCount": 0,
        "deltaActivists": 85,
        "byCity": [
          {
            "city": "Алматы",
            "fgCount": 1237,
            "appCount": 1237,
            "examCount": 1237,
            "activistsCount": 567,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "shymkent",
        "fgCount": 276,
        "appCount": 276,
        "examCount": 276,
        "activistsCount": 204,
        "rejectedCount": 0,
        "deltaActivists": 10,
        "byCity": [
          {
            "city": "Шымкент",
            "fgCount": 276,
            "appCount": 276,
            "examCount": 276,
            "activistsCount": 204,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "south",
        "fgCount": 871,
        "appCount": 871,
        "examCount": 871,
        "activistsCount": 653,
        "rejectedCount": 0,
        "deltaActivists": 29,
        "byCity": [
          {
            "city": "Тараз",
            "fgCount": 301,
            "appCount": 301,
            "examCount": 301,
            "activistsCount": 187,
            "rejectedCount": 0
          },
          {
            "city": "Туркестан",
            "fgCount": 215,
            "appCount": 215,
            "examCount": 215,
            "activistsCount": 181,
            "rejectedCount": 0
          },
          {
            "city": "Талдыкорган",
            "fgCount": 128,
            "appCount": 128,
            "examCount": 128,
            "activistsCount": 105,
            "rejectedCount": 0
          },
          {
            "city": "Кызылорда",
            "fgCount": 141,
            "appCount": 141,
            "examCount": 141,
            "activistsCount": 95,
            "rejectedCount": 0
          },
          {
            "city": "Қызылорда",
            "fgCount": 67,
            "appCount": 67,
            "examCount": 67,
            "activistsCount": 66,
            "rejectedCount": 0
          },
          {
            "city": "Түркістан",
            "fgCount": 19,
            "appCount": 19,
            "examCount": 19,
            "activistsCount": 19,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "north",
        "fgCount": 1095,
        "appCount": 1095,
        "examCount": 1095,
        "activistsCount": 544,
        "rejectedCount": 0,
        "deltaActivists": 76,
        "byCity": [
          {
            "city": "Костанай",
            "fgCount": 324,
            "appCount": 324,
            "examCount": 324,
            "activistsCount": 250,
            "rejectedCount": 0
          },
          {
            "city": "Петропавловск",
            "fgCount": 363,
            "appCount": 363,
            "examCount": 363,
            "activistsCount": 142,
            "rejectedCount": 0
          },
          {
            "city": "Кокшетау",
            "fgCount": 167,
            "appCount": 167,
            "examCount": 167,
            "activistsCount": 72,
            "rejectedCount": 0
          },
          {
            "city": "Жезказган",
            "fgCount": 211,
            "appCount": 211,
            "examCount": 211,
            "activistsCount": 59,
            "rejectedCount": 0
          },
          {
            "city": "Жезқазған",
            "fgCount": 30,
            "appCount": 30,
            "examCount": 30,
            "activistsCount": 21,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "west",
        "fgCount": 590,
        "appCount": 590,
        "examCount": 590,
        "activistsCount": 343,
        "rejectedCount": 0,
        "deltaActivists": 45,
        "byCity": [
          {
            "city": "Уральск",
            "fgCount": 149,
            "appCount": 149,
            "examCount": 149,
            "activistsCount": 102,
            "rejectedCount": 0
          },
          {
            "city": "Актау",
            "fgCount": 165,
            "appCount": 165,
            "examCount": 165,
            "activistsCount": 94,
            "rejectedCount": 0
          },
          {
            "city": "Актобе",
            "fgCount": 155,
            "appCount": 155,
            "examCount": 155,
            "activistsCount": 81,
            "rejectedCount": 0
          },
          {
            "city": "Атырау",
            "fgCount": 121,
            "appCount": 121,
            "examCount": 121,
            "activistsCount": 66,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "east",
        "fgCount": 664,
        "appCount": 664,
        "examCount": 664,
        "activistsCount": 340,
        "rejectedCount": 0,
        "deltaActivists": 53,
        "byCity": [
          {
            "city": "Павлодар",
            "fgCount": 186,
            "appCount": 186,
            "examCount": 186,
            "activistsCount": 104,
            "rejectedCount": 0
          },
          {
            "city": "Семей",
            "fgCount": 199,
            "appCount": 199,
            "examCount": 199,
            "activistsCount": 81,
            "rejectedCount": 0
          },
          {
            "city": "Усть-Каменогорск",
            "fgCount": 154,
            "appCount": 154,
            "examCount": 154,
            "activistsCount": 79,
            "rejectedCount": 0
          },
          {
            "city": "Караганда",
            "fgCount": 125,
            "appCount": 125,
            "examCount": 125,
            "activistsCount": 76,
            "rejectedCount": 0
          }
        ]
      }
    ],
    "records": []
  },
  {
    "id": "snap-auto-4",
    "createdAt": "2026-11-17T23:10:14.738Z",
    "comment": "Срез 4 (досверка)",
    "stats": [
      {
        "regionId": "astana",
        "fgCount": 928,
        "appCount": 928,
        "examCount": 928,
        "activistsCount": 629,
        "rejectedCount": 0,
        "deltaActivists": 79,
        "byCity": [
          {
            "city": "Астана",
            "fgCount": 928,
            "appCount": 928,
            "examCount": 928,
            "activistsCount": 629,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "almaty",
        "fgCount": 1237,
        "appCount": 1237,
        "examCount": 1237,
        "activistsCount": 709,
        "rejectedCount": 0,
        "deltaActivists": 142,
        "byCity": [
          {
            "city": "Алматы",
            "fgCount": 1237,
            "appCount": 1237,
            "examCount": 1237,
            "activistsCount": 709,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "shymkent",
        "fgCount": 276,
        "appCount": 276,
        "examCount": 276,
        "activistsCount": 219,
        "rejectedCount": 0,
        "deltaActivists": 15,
        "byCity": [
          {
            "city": "Шымкент",
            "fgCount": 276,
            "appCount": 276,
            "examCount": 276,
            "activistsCount": 219,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "south",
        "fgCount": 871,
        "appCount": 871,
        "examCount": 871,
        "activistsCount": 700,
        "rejectedCount": 0,
        "deltaActivists": 47,
        "byCity": [
          {
            "city": "Тараз",
            "fgCount": 301,
            "appCount": 301,
            "examCount": 301,
            "activistsCount": 212,
            "rejectedCount": 0
          },
          {
            "city": "Туркестан",
            "fgCount": 215,
            "appCount": 215,
            "examCount": 215,
            "activistsCount": 191,
            "rejectedCount": 0
          },
          {
            "city": "Талдыкорган",
            "fgCount": 128,
            "appCount": 128,
            "examCount": 128,
            "activistsCount": 109,
            "rejectedCount": 0
          },
          {
            "city": "Кызылорда",
            "fgCount": 141,
            "appCount": 141,
            "examCount": 141,
            "activistsCount": 103,
            "rejectedCount": 0
          },
          {
            "city": "Қызылорда",
            "fgCount": 67,
            "appCount": 67,
            "examCount": 67,
            "activistsCount": 66,
            "rejectedCount": 0
          },
          {
            "city": "Түркістан",
            "fgCount": 19,
            "appCount": 19,
            "examCount": 19,
            "activistsCount": 19,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "north",
        "fgCount": 1095,
        "appCount": 1095,
        "examCount": 1095,
        "activistsCount": 661,
        "rejectedCount": 0,
        "deltaActivists": 117,
        "byCity": [
          {
            "city": "Костанай",
            "fgCount": 324,
            "appCount": 324,
            "examCount": 324,
            "activistsCount": 266,
            "rejectedCount": 0
          },
          {
            "city": "Петропавловск",
            "fgCount": 363,
            "appCount": 363,
            "examCount": 363,
            "activistsCount": 188,
            "rejectedCount": 0
          },
          {
            "city": "Кокшетау",
            "fgCount": 167,
            "appCount": 167,
            "examCount": 167,
            "activistsCount": 92,
            "rejectedCount": 0
          },
          {
            "city": "Жезказган",
            "fgCount": 211,
            "appCount": 211,
            "examCount": 211,
            "activistsCount": 92,
            "rejectedCount": 0
          },
          {
            "city": "Жезқазған",
            "fgCount": 30,
            "appCount": 30,
            "examCount": 30,
            "activistsCount": 23,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "west",
        "fgCount": 590,
        "appCount": 590,
        "examCount": 590,
        "activistsCount": 396,
        "rejectedCount": 0,
        "deltaActivists": 53,
        "byCity": [
          {
            "city": "Уральск",
            "fgCount": 149,
            "appCount": 149,
            "examCount": 149,
            "activistsCount": 112,
            "rejectedCount": 0
          },
          {
            "city": "Актау",
            "fgCount": 165,
            "appCount": 165,
            "examCount": 165,
            "activistsCount": 110,
            "rejectedCount": 0
          },
          {
            "city": "Актобе",
            "fgCount": 155,
            "appCount": 155,
            "examCount": 155,
            "activistsCount": 98,
            "rejectedCount": 0
          },
          {
            "city": "Атырау",
            "fgCount": 121,
            "appCount": 121,
            "examCount": 121,
            "activistsCount": 76,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "east",
        "fgCount": 664,
        "appCount": 664,
        "examCount": 664,
        "activistsCount": 414,
        "rejectedCount": 0,
        "deltaActivists": 74,
        "byCity": [
          {
            "city": "Павлодар",
            "fgCount": 186,
            "appCount": 186,
            "examCount": 186,
            "activistsCount": 122,
            "rejectedCount": 0
          },
          {
            "city": "Семей",
            "fgCount": 199,
            "appCount": 199,
            "examCount": 199,
            "activistsCount": 107,
            "rejectedCount": 0
          },
          {
            "city": "Усть-Каменогорск",
            "fgCount": 154,
            "appCount": 154,
            "examCount": 154,
            "activistsCount": 98,
            "rejectedCount": 0
          },
          {
            "city": "Караганда",
            "fgCount": 125,
            "appCount": 125,
            "examCount": 125,
            "activistsCount": 87,
            "rejectedCount": 0
          }
        ]
      }
    ],
    "records": []
  },
  {
    "id": "snap-auto-5",
    "createdAt": "2026-11-18T00:10:14.739Z",
    "comment": "Срез 5 (итог 5-часовой сессии)",
    "stats": [
      {
        "regionId": "astana",
        "fgCount": 928,
        "appCount": 928,
        "examCount": 928,
        "activistsCount": 682,
        "rejectedCount": 0,
        "deltaActivists": 53,
        "byCity": [
          {
            "city": "Астана",
            "fgCount": 928,
            "appCount": 928,
            "examCount": 928,
            "activistsCount": 682,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "almaty",
        "fgCount": 1237,
        "appCount": 1237,
        "examCount": 1237,
        "activistsCount": 794,
        "rejectedCount": 0,
        "deltaActivists": 85,
        "byCity": [
          {
            "city": "Алматы",
            "fgCount": 1237,
            "appCount": 1237,
            "examCount": 1237,
            "activistsCount": 794,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "shymkent",
        "fgCount": 276,
        "appCount": 276,
        "examCount": 276,
        "activistsCount": 228,
        "rejectedCount": 0,
        "deltaActivists": 9,
        "byCity": [
          {
            "city": "Шымкент",
            "fgCount": 276,
            "appCount": 276,
            "examCount": 276,
            "activistsCount": 228,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "south",
        "fgCount": 871,
        "appCount": 871,
        "examCount": 871,
        "activistsCount": 730,
        "rejectedCount": 0,
        "deltaActivists": 30,
        "byCity": [
          {
            "city": "Тараз",
            "fgCount": 301,
            "appCount": 301,
            "examCount": 301,
            "activistsCount": 229,
            "rejectedCount": 0
          },
          {
            "city": "Туркестан",
            "fgCount": 215,
            "appCount": 215,
            "examCount": 215,
            "activistsCount": 195,
            "rejectedCount": 0
          },
          {
            "city": "Талдыкорган",
            "fgCount": 128,
            "appCount": 128,
            "examCount": 128,
            "activistsCount": 113,
            "rejectedCount": 0
          },
          {
            "city": "Кызылорда",
            "fgCount": 141,
            "appCount": 141,
            "examCount": 141,
            "activistsCount": 108,
            "rejectedCount": 0
          },
          {
            "city": "Қызылорда",
            "fgCount": 67,
            "appCount": 67,
            "examCount": 67,
            "activistsCount": 66,
            "rejectedCount": 0
          },
          {
            "city": "Түркістан",
            "fgCount": 19,
            "appCount": 19,
            "examCount": 19,
            "activistsCount": 19,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "north",
        "fgCount": 1095,
        "appCount": 1095,
        "examCount": 1095,
        "activistsCount": 741,
        "rejectedCount": 0,
        "deltaActivists": 80,
        "byCity": [
          {
            "city": "Костанай",
            "fgCount": 324,
            "appCount": 324,
            "examCount": 324,
            "activistsCount": 279,
            "rejectedCount": 0
          },
          {
            "city": "Петропавловск",
            "fgCount": 363,
            "appCount": 363,
            "examCount": 363,
            "activistsCount": 219,
            "rejectedCount": 0
          },
          {
            "city": "Жезказган",
            "fgCount": 211,
            "appCount": 211,
            "examCount": 211,
            "activistsCount": 115,
            "rejectedCount": 0
          },
          {
            "city": "Кокшетау",
            "fgCount": 167,
            "appCount": 167,
            "examCount": 167,
            "activistsCount": 104,
            "rejectedCount": 0
          },
          {
            "city": "Жезқазған",
            "fgCount": 30,
            "appCount": 30,
            "examCount": 30,
            "activistsCount": 24,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "west",
        "fgCount": 590,
        "appCount": 590,
        "examCount": 590,
        "activistsCount": 433,
        "rejectedCount": 0,
        "deltaActivists": 37,
        "byCity": [
          {
            "city": "Уральск",
            "fgCount": 149,
            "appCount": 149,
            "examCount": 149,
            "activistsCount": 119,
            "rejectedCount": 0
          },
          {
            "city": "Актау",
            "fgCount": 165,
            "appCount": 165,
            "examCount": 165,
            "activistsCount": 118,
            "rejectedCount": 0
          },
          {
            "city": "Актобе",
            "fgCount": 155,
            "appCount": 155,
            "examCount": 155,
            "activistsCount": 111,
            "rejectedCount": 0
          },
          {
            "city": "Атырау",
            "fgCount": 121,
            "appCount": 121,
            "examCount": 121,
            "activistsCount": 85,
            "rejectedCount": 0
          }
        ]
      },
      {
        "regionId": "east",
        "fgCount": 664,
        "appCount": 664,
        "examCount": 664,
        "activistsCount": 457,
        "rejectedCount": 0,
        "deltaActivists": 43,
        "byCity": [
          {
            "city": "Павлодар",
            "fgCount": 186,
            "appCount": 186,
            "examCount": 186,
            "activistsCount": 133,
            "rejectedCount": 0
          },
          {
            "city": "Семей",
            "fgCount": 199,
            "appCount": 199,
            "examCount": 199,
            "activistsCount": 121,
            "rejectedCount": 0
          },
          {
            "city": "Усть-Каменогорск",
            "fgCount": 154,
            "appCount": 154,
            "examCount": 154,
            "activistsCount": 110,
            "rejectedCount": 0
          },
          {
            "city": "Караганда",
            "fgCount": 125,
            "appCount": 125,
            "examCount": 125,
            "activistsCount": 93,
            "rejectedCount": 0
          }
        ]
      }
    ],
    "records": []
  }
] as Snapshot[]

export function getInitialState(): AppState {
  const published = seedSnapshots[seedSnapshots.length - 1]
  return normalizeState({ regions: defaultRegions, snapshots: seedSnapshots, publishedSnapshotId: published?.id || null })
}

/** Merge differently spelled city labels in previously saved data (e.g. Қызылорда / Кызылорда). */
function mergeCityBreakdown(items: CityBreakdown[] = []): CityBreakdown[] {
  const merged = new Map<string, CityBreakdown>()
  for (const item of items) {
    const city = canonicalCity(item.city)
    const prev = merged.get(city)
    if (!prev) {
      merged.set(city, { ...item, city })
      continue
    }
    prev.fgCount += item.fgCount || 0
    prev.appCount += item.appCount || 0
    prev.examCount += item.examCount || 0
    prev.activistsCount += item.activistsCount || 0
    prev.rejectedCount += item.rejectedCount || 0
  }
  return [...merged.values()].sort((a, b) => b.activistsCount - a.activistsCount)
}

export function normalizeState(parsed: AppState): AppState {
  return {
    ...parsed,
    regions: parsed.regions.map((r) => ({ ...r, cities: canonicalCityList(r.cities || []) })),
    snapshots: parsed.snapshots.map((s) => ({
      ...s,
      stats: (s.stats || []).map((st) => ({ ...st, byCity: mergeCityBreakdown(st.byCity) })),
      records: (s.records || []).map((rec) => ({ ...rec, city: canonicalCity(rec.city) })),
    })),
  }
}

export async function loadState(): Promise<AppState> {
  try {
    const res = await fetch('/api/state', { cache: 'no-store' })
    if (!res.ok) throw new Error(`State load failed: ${res.status}`)
    const parsed = (await res.json()) as AppState
    if (!parsed.regions || !Array.isArray(parsed.snapshots)) return getInitialState()
    return normalizeState(parsed)
  } catch {
    return getInitialState()
  }
}

export async function saveState(state: AppState): Promise<void> {
  const res = await fetch('/api/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `State save failed: ${res.status}`)
  }
}

export function getPublished(state: AppState): Snapshot | null {
  return state.snapshots.find((s) => s.id === state.publishedSnapshotId) || state.snapshots[state.snapshots.length - 1] || null
}
