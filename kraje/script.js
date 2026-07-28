const lang = localStorage.getItem('lang') || 'pl';
// ─── Country Data ────────────────────────────────────────────────────────────
const COUNTRIES = {
    "Europa": [
        { panstwo: "Polska",               panstwo_en: "Poland",                 stolica: "Warszawa",           stolica_en: "Warsaw",            flaga: "🇵🇱", ludnosc: "38,4 mln",   powierzchnia: "312,7 tys. km²"  },
        { panstwo: "Niemcy",               panstwo_en: "Germany",                stolica: "Berlin",                                              flaga: "🇩🇪", ludnosc: "84,1 mln",   powierzchnia: "357,1 tys. km²"  },
        { panstwo: "Francja",              panstwo_en: "France",                 stolica: "Paryż",              stolica_en: "Paris",             flaga: "🇫🇷", ludnosc: "68,0 mln",   powierzchnia: "551,7 tys. km²"  },
        { panstwo: "Włochy",               panstwo_en: "Italy",                  stolica: "Rzym",               stolica_en: "Rome",              flaga: "🇮🇹", ludnosc: "60,4 mln",   powierzchnia: "301,3 tys. km²"  },
        { panstwo: "Hiszpania",            panstwo_en: "Spain",                  stolica: "Madryt",             stolica_en: "Madrid",            flaga: "🇪🇸", ludnosc: "47,4 mln",   powierzchnia: "505,9 tys. km²"  },
        { panstwo: "Wielka Brytania",      panstwo_en: "United Kingdom",         stolica: "Londyn",             stolica_en: "London",            flaga: "🇬🇧", ludnosc: "67,6 mln",   powierzchnia: "243,6 tys. km²"  },
        { panstwo: "Holandia",             panstwo_en: "Netherlands",            stolica: "Amsterdam",                                           flaga: "🇳🇱", ludnosc: "17,9 mln",   powierzchnia: "41,5 tys. km²"   },
        { panstwo: "Belgia",               panstwo_en: "Belgium",                stolica: "Bruksela",           stolica_en: "Brussels",          flaga: "🇧🇪", ludnosc: "11,6 mln",   powierzchnia: "30,5 tys. km²"   },
        { panstwo: "Szwecja",              panstwo_en: "Sweden",                 stolica: "Sztokholm",          stolica_en: "Stockholm",         flaga: "🇸🇪", ludnosc: "10,5 mln",   powierzchnia: "450,3 tys. km²"  },
        { panstwo: "Norwegia",             panstwo_en: "Norway",                 stolica: "Oslo",                                                flaga: "🇳🇴", ludnosc: "5,4 mln",    powierzchnia: "385,2 tys. km²"  },
        { panstwo: "Dania",                panstwo_en: "Denmark",                stolica: "Kopenhaga",          stolica_en: "Copenhagen",        flaga: "🇩🇰", ludnosc: "5,9 mln",    powierzchnia: "43,1 tys. km²"   },
        { panstwo: "Finlandia",            panstwo_en: "Finland",                stolica: "Helsinki",                                            flaga: "🇫🇮", ludnosc: "5,5 mln",    powierzchnia: "338,4 tys. km²"  },
        { panstwo: "Portugalia",           panstwo_en: "Portugal",               stolica: "Lizbona",            stolica_en: "Lisbon",            flaga: "🇵🇹", ludnosc: "10,3 mln",   powierzchnia: "92,2 tys. km²"   },
        { panstwo: "Grecja",               panstwo_en: "Greece",                 stolica: "Ateny",              stolica_en: "Athens",            flaga: "🇬🇷", ludnosc: "10,6 mln",   powierzchnia: "131,9 tys. km²"  },
        { panstwo: "Austria",                                                    stolica: "Wiedeń",             stolica_en: "Vienna",            flaga: "🇦🇹", ludnosc: "9,0 mln",    powierzchnia: "83,9 tys. km²"   },
        { panstwo: "Szwajcaria",           panstwo_en: "Switzerland",            stolica: "Berno",              stolica_en: "Bern",              flaga: "🇨🇭", ludnosc: "8,7 mln",    powierzchnia: "41,3 tys. km²"   },
        { panstwo: "Czechy",               panstwo_en: "Czechia",                stolica: "Praga",              stolica_en: "Prague",            flaga: "🇨🇿", ludnosc: "10,9 mln",   powierzchnia: "78,9 tys. km²"   },
        { panstwo: "Węgry",                panstwo_en: "Hungary",                stolica: "Budapeszt",          stolica_en: "Budapest",          flaga: "🇭🇺", ludnosc: "9,7 mln",    powierzchnia: "93,0 tys. km²"   },
        { panstwo: "Rumunia",              panstwo_en: "Romania",                stolica: "Bukareszt",          stolica_en: "Bucharest",         flaga: "🇷🇴", ludnosc: "19,0 mln",   powierzchnia: "238,4 tys. km²"  },
        { panstwo: "Ukraina",              panstwo_en: "Ukraine",                stolica: "Kijów",              stolica_en: "Kyiv",              flaga: "🇺🇦", ludnosc: "43,5 mln",   powierzchnia: "603,6 tys. km²"  },
        { panstwo: "Albania",                                                    stolica: "Tirana",                                              flaga: "🇦🇱", ludnosc: "2,8 mln",    powierzchnia: "28,7 tys. km²"   },
        { panstwo: "Andora",               panstwo_en: "Andorra",                stolica: "Andora la Vella",                                     flaga: "🇦🇩", ludnosc: "0,08 mln",   powierzchnia: "0,47 tys. km²"   },
        { panstwo: "Armenia",                                                    stolica: "Erywań",             stolica_en: "Yerevan",           flaga: "🇦🇲", ludnosc: "2,97 mln",   powierzchnia: "29,7 tys. km²"   },
        { panstwo: "Azerbejdżan",          panstwo_en: "Azerbaijan",             stolica: "Baku",                                                flaga: "🇦🇿", ludnosc: "10,3 mln",   powierzchnia: "86,6 tys. km²"   },
        { panstwo: "Białoruś",             panstwo_en: "Belarus",                stolica: "Mińsk",              stolica_en: "Minsk",             flaga: "🇧🇾", ludnosc: "9,4 mln",    powierzchnia: "207,6 tys. km²"  },
        { panstwo: "Bośnia i Hercegowina", panstwo_en: "Bosnia and Herzegovina", stolica: "Sarajewo",           stolica_en: "Sarajevo",          flaga: "🇧🇦", ludnosc: "3,3 mln",    powierzchnia: "51,2 tys. km²"   },
        { panstwo: "Bułgaria",             panstwo_en: "Bulgaria",               stolica: "Sofia",                                               flaga: "🇧🇬", ludnosc: "6,5 mln",    powierzchnia: "110,9 tys. km²"  },
        { panstwo: "Chorwacja",            panstwo_en: "Croatia",                stolica: "Zagrzeb",            stolica_en: "Zagreb",            flaga: "🇭🇷", ludnosc: "3,9 mln",    powierzchnia: "56,6 tys. km²"   },
        { panstwo: "Cypr",                 panstwo_en: "Cyprus",                 stolica: "Nikozja",            stolica_en: "Nicosia",           flaga: "🇨🇾", ludnosc: "1,25 mln",   powierzchnia: "9,25 tys. km²"   },
        { panstwo: "Czarnogóra",           panstwo_en: "Montenegro",             stolica: "Podgorica",                                           flaga: "🇲🇪", ludnosc: "0,62 mln",   powierzchnia: "13,8 tys. km²"   },
        { panstwo: "Estonia",                                                    stolica: "Tallin",             stolica_en: "Tallinn",           flaga: "🇪🇪", ludnosc: "1,33 mln",   powierzchnia: "45,2 tys. km²"   },
        { panstwo: "Gruzja",               panstwo_en: "Georgia",                stolica: "Tbilisi",                                             flaga: "🇬🇪", ludnosc: "3,7 mln",    powierzchnia: "69,7 tys. km²"   },
        { panstwo: "Irlandia",             panstwo_en: "Ireland",                stolica: "Dublin",                                              flaga: "🇮🇪", ludnosc: "5,1 mln",    powierzchnia: "70,3 tys. km²"   },
        { panstwo: "Islandia",             panstwo_en: "Iceland",                stolica: "Reykjavik",                                           flaga: "🇮🇸", ludnosc: "0,37 mln",   powierzchnia: "103,0 tys. km²"  },
        { panstwo: "Kosowo",               panstwo_en: "Kosovo",                 stolica: "Prisztina",          stolica_en: "Pristina",          flaga: "🇽🇰", ludnosc: "1,8 mln",    powierzchnia: "10,9 tys. km²"   },
        { panstwo: "Liechtenstein",                                              stolica: "Vaduz",                                               flaga: "🇱🇮", ludnosc: "0,038 mln",  powierzchnia: "0,16 tys. km²"   },
        { panstwo: "Litwa",                panstwo_en: "Lithuania",              stolica: "Wilno",              stolica_en: "Vilnius",           flaga: "🇱🇹", ludnosc: "2,8 mln",    powierzchnia: "65,3 tys. km²"   },
        { panstwo: "Luksemburg",           panstwo_en: "Luxembourg",             stolica: "Luksemburg",                                          flaga: "🇱🇺", ludnosc: "0,66 mln",   powierzchnia: "2,59 tys. km²"   },
        { panstwo: "Łotwa",                panstwo_en: "Latvia",                 stolica: "Ryga",               stolica_en: "Riga",              flaga: "🇱🇻", ludnosc: "1,84 mln",   powierzchnia: "64,6 tys. km²"   },
        { panstwo: "Macedonia Północna",   panstwo_en: "North Macedonia",        stolica: "Skopje",                                              flaga: "🇲🇰", ludnosc: "2,1 mln",    powierzchnia: "25,7 tys. km²"   },
        { panstwo: "Malta",                                                      stolica: "Valletta",                                            flaga: "🇲🇹", ludnosc: "0,53 mln",   powierzchnia: "0,32 tys. km²"   },
        { panstwo: "Mołdawia",             panstwo_en: "Moldova",                stolica: "Kiszyniów",          stolica_en: "Chișinău",          flaga: "🇲🇩", ludnosc: "2,6 mln",    powierzchnia: "33,8 tys. km²"   },
        { panstwo: "Monako",               panstwo_en: "Monaco",                 stolica: "Monako",                                              flaga: "🇲🇨", ludnosc: "0,036 mln",  powierzchnia: "0,002 tys. km²"  },
        { panstwo: "Rosja",                panstwo_en: "Russia",                 stolica: "Moskwa",             stolica_en: "Moscow",            flaga: "🇷🇺", ludnosc: "144,7 mln",  powierzchnia: "17 098 tys. km²" },
        { panstwo: "San Marino",                                                 stolica: "San Marino",                                          flaga: "🇸🇲", ludnosc: "0,034 mln",  powierzchnia: "0,061 tys. km²"  },
        { panstwo: "Serbia",                                                     stolica: "Belgrad",            stolica_en: "Belgrade",          flaga: "🇷🇸", ludnosc: "6,8 mln",    powierzchnia: "77,5 tys. km²"   },
        { panstwo: "Słowacja",             panstwo_en: "Slovakia",               stolica: "Bratysława",         stolica_en: "Bratislava",        flaga: "🇸🇰", ludnosc: "5,5 mln",    powierzchnia: "49,0 tys. km²"   },
        { panstwo: "Słowenia",             panstwo_en: "Slovenia",               stolica: "Lublana",            stolica_en: "Ljubljana",         flaga: "🇸🇮", ludnosc: "2,1 mln",    powierzchnia: "20,3 tys. km²"   },
        { panstwo: "Watykan",              panstwo_en: "Vatican City",           stolica: "Watykan",            stolica_en: "Vatican City",      flaga: "🇻🇦", ludnosc: "0,0008 mln", powierzchnia: "0,00044 tys. km²"},
    ],
    "Azja": [
        { panstwo: "Chiny",                        panstwo_en: "China",               stolica: "Pekin",                    stolica_en: "Beijing",           flaga: "🇨🇳", ludnosc: "1 409 mln",  powierzchnia: "9 597 tys. km²" },
        { panstwo: "Indie",                        panstwo_en: "India",               stolica: "Nowe Delhi",                                                flaga: "🇮🇳", ludnosc: "1 428 mln",  powierzchnia: "3 287 tys. km²" },
        { panstwo: "Japonia",                      panstwo_en: "Japan",               stolica: "Tokio",                    stolica_en: "Tokyo",             flaga: "🇯🇵", ludnosc: "124,5 mln",  powierzchnia: "377,9 tys. km²" },
        { panstwo: "Korea Południowa",             panstwo_en: "South Korea",         stolica: "Seul",                     stolica_en: "Seoul",             flaga: "🇰🇷", ludnosc: "51,7 mln",   powierzchnia: "100,4 tys. km²" },
        { panstwo: "Indonezja",                    panstwo_en: "Indonesia",           stolica: "Dżakarta",                 stolica_en: "Jakarta",           flaga: "🇮🇩", ludnosc: "275,5 mln",  powierzchnia: "1 905 tys. km²" },
        { panstwo: "Wietnam",                      panstwo_en: "Vietnam",             stolica: "Hanoi",                                                     flaga: "🇻🇳", ludnosc: "97,3 mln",   powierzchnia: "331,2 tys. km²" },
        { panstwo: "Tajlandia",                    panstwo_en: "Thailand",            stolica: "Bangkok",                                                   flaga: "🇹🇭", ludnosc: "71,6 mln",   powierzchnia: "513,1 tys. km²" },
        { panstwo: "Arabia Saudyjska",             panstwo_en: "Saudi Arabia",        stolica: "Rijad",                    stolica_en: "Riyadh",            flaga: "🇸🇦", ludnosc: "35,0 mln",   powierzchnia: "2 150 tys. km²" },
        { panstwo: "Iran",                                                            stolica: "Teheran",                  stolica_en: "Tehran",            flaga: "🇮🇷", ludnosc: "87,9 mln",   powierzchnia: "1 648 tys. km²" },
        { panstwo: "Irak",                         panstwo_en: "Iraq",                stolica: "Bagdad",                   stolica_en: "Baghdad",           flaga: "🇮🇶", ludnosc: "42,3 mln",   powierzchnia: "438,3 tys. km²" },
        { panstwo: "Turcja",                       panstwo_en: "Turkey",              stolica: "Ankara",                                                    flaga: "🇹🇷", ludnosc: "85,3 mln",   powierzchnia: "783,6 tys. km²" },
        { panstwo: "Pakistan",                                                        stolica: "Islamabad",                                                 flaga: "🇵🇰", ludnosc: "231,4 mln",  powierzchnia: "881,9 tys. km²" },
        { panstwo: "Bangladesz",                   panstwo_en: "Bangladesh",          stolica: "Dhaka",                                                     flaga: "🇧🇩", ludnosc: "166,3 mln",  powierzchnia: "147,6 tys. km²" },
        { panstwo: "Malezja",                      panstwo_en: "Malaysia",            stolica: "Kuala Lumpur",                                              flaga: "🇲🇾", ludnosc: "32,8 mln",   powierzchnia: "329,8 tys. km²" },
        { panstwo: "Filipiny",                     panstwo_en: "Philippines",         stolica: "Manila",                                                    flaga: "🇵🇭", ludnosc: "115,6 mln",  powierzchnia: "300,0 tys. km²" },
        { panstwo: "Afganistan",                   panstwo_en: "Afghanistan",         stolica: "Kabul",                                                     flaga: "🇦🇫", ludnosc: "40,1 mln",   powierzchnia: "652,9 tys. km²" },
        { panstwo: "Bahrajn",                      panstwo_en: "Bahrain",             stolica: "Manama",                                                    flaga: "🇧🇭", ludnosc: "1,5 mln",    powierzchnia: "0,77 tys. km²"  },
        { panstwo: "Bhutan",                                                          stolica: "Thimphu",                                                   flaga: "🇧🇹", ludnosc: "0,78 mln",   powierzchnia: "38,4 tys. km²"  },
        { panstwo: "Brunei",                                                          stolica: "Bandar Seri Begawan",                                        flaga: "🇧🇳", ludnosc: "0,44 mln",   powierzchnia: "5,8 tys. km²"   },
        { panstwo: "Izrael",                       panstwo_en: "Israel",              stolica: "Jerozolima",               stolica_en: "Jerusalem",         flaga: "🇮🇱", ludnosc: "9,2 mln",    powierzchnia: "20,8 tys. km²"  },
        { panstwo: "Jemen",                        panstwo_en: "Yemen",               stolica: "Sana",                     stolica_en: "Sana'a",            flaga: "🇾🇪", ludnosc: "33,7 mln",   powierzchnia: "527,9 tys. km²" },
        { panstwo: "Jordania",                     panstwo_en: "Jordan",              stolica: "Amman",                                                     flaga: "🇯🇴", ludnosc: "10,2 mln",   powierzchnia: "89,3 tys. km²"  },
        { panstwo: "Kambodża",                     panstwo_en: "Cambodia",            stolica: "Phnom Penh",                                                flaga: "🇰🇭", ludnosc: "16,7 mln",   powierzchnia: "181,0 tys. km²" },
        { panstwo: "Katar",                        panstwo_en: "Qatar",               stolica: "Doha",                                                      flaga: "🇶🇦", ludnosc: "2,7 mln",    powierzchnia: "11,6 tys. km²"  },
        { panstwo: "Kazachstan",                   panstwo_en: "Kazakhstan",          stolica: "Astana",                                                    flaga: "🇰🇿", ludnosc: "19,2 mln",   powierzchnia: "2 725 tys. km²" },
        { panstwo: "Kirgistan",                    panstwo_en: "Kyrgyzstan",          stolica: "Biszkek",                  stolica_en: "Bishkek",           flaga: "🇰🇬", ludnosc: "6,6 mln",    powierzchnia: "199,9 tys. km²" },
        { panstwo: "Korea Północna",               panstwo_en: "North Korea",         stolica: "Pjongjang",                stolica_en: "Pyongyang",         flaga: "🇰🇵", ludnosc: "25,9 mln",   powierzchnia: "120,5 tys. km²" },
        { panstwo: "Kuwejt",                       panstwo_en: "Kuwait",              stolica: "Kuwejt",                   stolica_en: "Kuwait City",       flaga: "🇰🇼", ludnosc: "4,2 mln",    powierzchnia: "17,8 tys. km²"  },
        { panstwo: "Laos",                                                            stolica: "Wientian",                 stolica_en: "Vientiane",         flaga: "🇱🇦", ludnosc: "7,4 mln",    powierzchnia: "236,8 tys. km²" },
        { panstwo: "Liban",                        panstwo_en: "Lebanon",             stolica: "Bejrut",                   stolica_en: "Beirut",            flaga: "🇱🇧", ludnosc: "5,5 mln",    powierzchnia: "10,5 tys. km²"  },
        { panstwo: "Malediwy",                     panstwo_en: "Maldives",            stolica: "Malé",                                                      flaga: "🇲🇻", ludnosc: "0,52 mln",   powierzchnia: "0,30 tys. km²"  },
        { panstwo: "Mjanma",                       panstwo_en: "Myanmar",             stolica: "Naypyidaw",                                                 flaga: "🇲🇲", ludnosc: "54,4 mln",   powierzchnia: "676,6 tys. km²" },
        { panstwo: "Mongolia",                                                        stolica: "Ułan Bator",               stolica_en: "Ulaanbaatar",       flaga: "🇲🇳", ludnosc: "3,4 mln",    powierzchnia: "1 564 tys. km²" },
        { panstwo: "Nepal",                                                           stolica: "Katmandu",                 stolica_en: "Kathmandu",         flaga: "🇳🇵", ludnosc: "29,7 mln",   powierzchnia: "147,2 tys. km²" },
        { panstwo: "Oman",                                                            stolica: "Maskat",                   stolica_en: "Muscat",            flaga: "🇴🇲", ludnosc: "4,5 mln",    powierzchnia: "309,5 tys. km²" },
        { panstwo: "Palestyna",                    panstwo_en: "Palestine",           stolica: "Ramallah",                                                  flaga: "🇵🇸", ludnosc: "5,3 mln",    powierzchnia: "6,0 tys. km²"   },
        { panstwo: "Singapur",                     panstwo_en: "Singapore",           stolica: "Singapur",                 stolica_en: "Singapore",         flaga: "🇸🇬", ludnosc: "5,9 mln",    powierzchnia: "0,73 tys. km²"  },
        { panstwo: "Sri Lanka",                                                       stolica: "Sri Dżajawardenapura Kotte", stolica_en: "Sri Jayawardenepura Kotte", flaga: "🇱🇰", ludnosc: "22,2 mln", powierzchnia: "65,6 tys. km²" },
        { panstwo: "Syria",                                                           stolica: "Damaszek",                 stolica_en: "Damascus",          flaga: "🇸🇾", ludnosc: "21,3 mln",   powierzchnia: "185,2 tys. km²" },
        { panstwo: "Tadżykistan",                  panstwo_en: "Tajikistan",          stolica: "Duszanbe",                 stolica_en: "Dushanbe",          flaga: "🇹🇯", ludnosc: "9,9 mln",    powierzchnia: "143,1 tys. km²" },
        { panstwo: "Timor Wschodni",               panstwo_en: "East Timor",          stolica: "Dili",                                                      flaga: "🇹🇱", ludnosc: "1,3 mln",    powierzchnia: "14,9 tys. km²"  },
        { panstwo: "Turkmenistan",                                                    stolica: "Aszchabad",                stolica_en: "Ashgabat",          flaga: "🇹🇲", ludnosc: "6,1 mln",    powierzchnia: "488,1 tys. km²" },
        { panstwo: "Uzbekistan",                                                      stolica: "Taszkent",                 stolica_en: "Tashkent",          flaga: "🇺🇿", ludnosc: "35,3 mln",   powierzchnia: "448,9 tys. km²" },
        { panstwo: "Zjednoczone Emiraty Arabskie", panstwo_en: "United Arab Emirates", stolica: "Abu Zabi",               stolica_en: "Abu Dhabi",         flaga: "🇦🇪", ludnosc: "9,3 mln",    powierzchnia: "83,6 tys. km²"  },
    ],
    "Ameryka Północna": [
        { panstwo: "Stany Zjednoczone", panstwo_en: "United States", stolica: "Waszyngton",  stolica_en: "Washington D.C.",  flaga: "🇺🇸", ludnosc: "332,0 mln",  powierzchnia: "9 833 tys. km²" },
        { panstwo: "Kanada",            panstwo_en: "Canada",        stolica: "Ottawa",                                      flaga: "🇨🇦", ludnosc: "38,2 mln",   powierzchnia: "9 985 tys. km²" },
        { panstwo: "Meksyk",            panstwo_en: "Mexico",        stolica: "Meksyk",      stolica_en: "Mexico City",      flaga: "🇲🇽", ludnosc: "130,3 mln",  powierzchnia: "1 964 tys. km²" },
        { panstwo: "Kuba",              panstwo_en: "Cuba",          stolica: "Hawana",      stolica_en: "Havana",           flaga: "🇨🇺", ludnosc: "11,3 mln",   powierzchnia: "110,9 tys. km²" },
        { panstwo: "Gwatemala",         panstwo_en: "Guatemala",     stolica: "Gwatemala",   stolica_en: "Guatemala City",   flaga: "🇬🇹", ludnosc: "17,1 mln",   powierzchnia: "108,9 tys. km²" },
        { panstwo: "Honduras",                                       stolica: "Tegucigalpa",                                 flaga: "🇭🇳", ludnosc: "10,3 mln",   powierzchnia: "112,5 tys. km²" },
        { panstwo: "Nikaragua",         panstwo_en: "Nicaragua",     stolica: "Managua",                                     flaga: "🇳🇮", ludnosc: "6,9 mln",    powierzchnia: "130,4 tys. km²" },
        { panstwo: "Kostaryka",         panstwo_en: "Costa Rica",    stolica: "San José",                                    flaga: "🇨🇷", ludnosc: "5,2 mln",    powierzchnia: "51,1 tys. km²"  },
        { panstwo: "Panama",                                         stolica: "Panama",      stolica_en: "Panama City",      flaga: "🇵🇦", ludnosc: "4,4 mln",    powierzchnia: "75,4 tys. km²"  },
        { panstwo: "Jamajka",           panstwo_en: "Jamaica",       stolica: "Kingston",                                    flaga: "🇯🇲", ludnosc: "2,8 mln",    powierzchnia: "10,9 tys. km²"  },
    ],
    "Ameryka Południowa": [
        { panstwo: "Brazylia",   panstwo_en: "Brazil",     stolica: "Brasília",     flaga: "🇧🇷", ludnosc: "215,3 mln",  powierzchnia: "8 516 tys. km²" },
        { panstwo: "Argentyna",  panstwo_en: "Argentina",  stolica: "Buenos Aires", flaga: "🇦🇷", ludnosc: "45,8 mln",   powierzchnia: "2 780 tys. km²" },
        { panstwo: "Kolumbia",   panstwo_en: "Colombia",   stolica: "Bogota",       flaga: "🇨🇴", ludnosc: "51,5 mln",   powierzchnia: "1 142 tys. km²" },
        { panstwo: "Peru",                                  stolica: "Lima",         flaga: "🇵🇪", ludnosc: "33,3 mln",   powierzchnia: "1 285 tys. km²" },
        { panstwo: "Wenezuela",  panstwo_en: "Venezuela",  stolica: "Caracas",      flaga: "🇻🇪", ludnosc: "28,9 mln",   powierzchnia: "912,1 tys. km²" },
        { panstwo: "Chile",                                 stolica: "Santiago",     flaga: "🇨🇱", ludnosc: "19,1 mln",   powierzchnia: "756,1 tys. km²" },
        { panstwo: "Boliwia",    panstwo_en: "Bolivia",    stolica: "Sucre",        flaga: "🇧🇴", ludnosc: "12,1 mln",   powierzchnia: "1 099 tys. km²" },
        { panstwo: "Paragwaj",   panstwo_en: "Paraguay",   stolica: "Asunción",     flaga: "🇵🇾", ludnosc: "7,4 mln",    powierzchnia: "406,8 tys. km²" },
        { panstwo: "Urugwaj",    panstwo_en: "Uruguay",    stolica: "Montevideo",   flaga: "🇺🇾", ludnosc: "3,5 mln",    powierzchnia: "176,2 tys. km²" },
        { panstwo: "Ekwador",    panstwo_en: "Ecuador",    stolica: "Quito",        flaga: "🇪🇨", ludnosc: "18,0 mln",   powierzchnia: "283,6 tys. km²" },
    ],
    "Afryka": [
        { panstwo: "Nigeria",                                                        stolica: "Abuja",          flaga: "🇳🇬", ludnosc: "220,0 mln",   powierzchnia: "923,8 tys. km²"  },
        { panstwo: "Etiopia",                       panstwo_en: "Ethiopia",          stolica: "Addis Abeba",    stolica_en: "Addis Ababa",       flaga: "🇪🇹", ludnosc: "125,0 mln",   powierzchnia: "1 104 tys. km²"  },
        { panstwo: "Egipt",                         panstwo_en: "Egypt",             stolica: "Kair",           stolica_en: "Cairo",             flaga: "🇪🇬", ludnosc: "104,3 mln",   powierzchnia: "1 002 tys. km²"  },
        { panstwo: "Kongo",                         panstwo_en: "DR Congo",          stolica: "Kinszasa",       stolica_en: "Kinshasa",          flaga: "🇨🇩", ludnosc: "100,0 mln",   powierzchnia: "2 345 tys. km²"  },
        { panstwo: "Tanzania",                                                       stolica: "Dodoma",         flaga: "🇹🇿", ludnosc: "63,3 mln",    powierzchnia: "945,1 tys. km²"  },
        { panstwo: "Kenia",                         panstwo_en: "Kenya",             stolica: "Nairobi",        flaga: "🇰🇪", ludnosc: "54,0 mln",    powierzchnia: "580,4 tys. km²"  },
        { panstwo: "Algieria",                      panstwo_en: "Algeria",           stolica: "Algier",         stolica_en: "Algiers",           flaga: "🇩🇿", ludnosc: "45,6 mln",    powierzchnia: "2 382 tys. km²"  },
        { panstwo: "Maroko",                        panstwo_en: "Morocco",           stolica: "Rabat",          flaga: "🇲🇦", ludnosc: "37,5 mln",    powierzchnia: "446,6 tys. km²"  },
        { panstwo: "Mozambik",                      panstwo_en: "Mozambique",        stolica: "Maputo",         flaga: "🇲🇿", ludnosc: "32,8 mln",    powierzchnia: "801,6 tys. km²"  },
        { panstwo: "Ghana",                                                          stolica: "Akra",           stolica_en: "Accra",             flaga: "🇬🇭", ludnosc: "32,4 mln",    powierzchnia: "238,5 tys. km²"  },
        { panstwo: "RPA",                           panstwo_en: "South Africa",      stolica: "Pretoria",       flaga: "🇿🇦", ludnosc: "60,0 mln",    powierzchnia: "1 221 tys. km²"  },
        { panstwo: "Sudan",                                                          stolica: "Chartum",        stolica_en: "Khartoum",          flaga: "🇸🇩", ludnosc: "46,9 mln",    powierzchnia: "1 887 tys. km²"  },
        { panstwo: "Angola",                                                         stolica: "Luanda",         flaga: "🇦🇴", ludnosc: "34,5 mln",    powierzchnia: "1 247 tys. km²"  },
        { panstwo: "Benin",                                                          stolica: "Porto-Novo",     flaga: "🇧🇯", ludnosc: "13,0 mln",    powierzchnia: "112,6 tys. km²"  },
        { panstwo: "Botswana",                                                       stolica: "Gaborone",       flaga: "🇧🇼", ludnosc: "2,6 mln",     powierzchnia: "581,7 tys. km²"  },
        { panstwo: "Burkina Faso",                                                   stolica: "Wagadugu",       stolica_en: "Ouagadougou",       flaga: "🇧🇫", ludnosc: "22,1 mln",    powierzchnia: "274,2 tys. km²"  },
        { panstwo: "Burundi",                                                        stolica: "Gitega",         flaga: "🇧🇮", ludnosc: "12,6 mln",    powierzchnia: "27,8 tys. km²"   },
        { panstwo: "Cabo Verde",                    panstwo_en: "Cape Verde",        stolica: "Praia",          flaga: "🇨🇻", ludnosc: "0,55 mln",    powierzchnia: "4,0 tys. km²"    },
        { panstwo: "Czad",                          panstwo_en: "Chad",              stolica: "Ndżamena",       stolica_en: "N'Djamena",         flaga: "🇹🇩", ludnosc: "17,4 mln",    powierzchnia: "1 284 tys. km²"  },
        { panstwo: "Dżibuti",                       panstwo_en: "Djibouti",          stolica: "Dżibuti",        stolica_en: "Djibouti",          flaga: "🇩🇯", ludnosc: "1,0 mln",     powierzchnia: "23,2 tys. km²"   },
        { panstwo: "Erytrea",                       panstwo_en: "Eritrea",           stolica: "Asmara",         flaga: "🇪🇷", ludnosc: "3,5 mln",     powierzchnia: "117,6 tys. km²"  },
        { panstwo: "Eswatini",                                                       stolica: "Mbabane",        flaga: "🇸🇿", ludnosc: "1,2 mln",     powierzchnia: "17,4 tys. km²"   },
        { panstwo: "Gabon",                                                          stolica: "Libreville",     flaga: "🇬🇦", ludnosc: "2,3 mln",     powierzchnia: "267,7 tys. km²"  },
        { panstwo: "Gambia",                                                         stolica: "Bandżul",        stolica_en: "Banjul",            flaga: "🇬🇲", ludnosc: "2,5 mln",     powierzchnia: "11,3 tys. km²"   },
        { panstwo: "Gwinea",                        panstwo_en: "Guinea",            stolica: "Konakry",        stolica_en: "Conakry",           flaga: "🇬🇳", ludnosc: "13,5 mln",    powierzchnia: "245,9 tys. km²"  },
        { panstwo: "Gwinea Bissau",                 panstwo_en: "Guinea-Bissau",     stolica: "Bissau",         flaga: "🇬🇼", ludnosc: "2,1 mln",     powierzchnia: "36,1 tys. km²"   },
        { panstwo: "Gwinea Równikowa",              panstwo_en: "Equatorial Guinea", stolica: "Malabo",         flaga: "🇬🇶", ludnosc: "1,5 mln",     powierzchnia: "28,1 tys. km²"   },
        { panstwo: "Kamerun",                       panstwo_en: "Cameroon",          stolica: "Jaunde",         stolica_en: "Yaoundé",           flaga: "🇨🇲", ludnosc: "27,2 mln",    powierzchnia: "475,4 tys. km²"  },
        { panstwo: "Komory",                        panstwo_en: "Comoros",           stolica: "Moroni",         flaga: "🇰🇲", ludnosc: "0,82 mln",    powierzchnia: "1,9 tys. km²"    },
        { panstwo: "Lesotho",                                                        stolica: "Maseru",         flaga: "🇱🇸", ludnosc: "2,2 mln",     powierzchnia: "30,4 tys. km²"   },
        { panstwo: "Liberia",                                                        stolica: "Monrovia",       flaga: "🇱🇷", ludnosc: "5,3 mln",     powierzchnia: "111,4 tys. km²"  },
        { panstwo: "Libia",                         panstwo_en: "Libya",             stolica: "Trypolis",       stolica_en: "Tripoli",           flaga: "🇱🇾", ludnosc: "6,8 mln",     powierzchnia: "1 760 tys. km²"  },
        { panstwo: "Madagaskar",                    panstwo_en: "Madagascar",        stolica: "Antananarywa",   stolica_en: "Antananarivo",      flaga: "🇲🇬", ludnosc: "27,7 mln",    powierzchnia: "587,0 tys. km²"  },
        { panstwo: "Malawi",                                                         stolica: "Lilongwe",       flaga: "🇲🇼", ludnosc: "19,9 mln",    powierzchnia: "118,5 tys. km²"  },
        { panstwo: "Mali",                                                           stolica: "Bamako",         flaga: "🇲🇱", ludnosc: "22,4 mln",    powierzchnia: "1 241 tys. km²"  },
        { panstwo: "Mauretania",                    panstwo_en: "Mauritania",        stolica: "Nawakszut",      stolica_en: "Nouakchott",        flaga: "🇲🇷", ludnosc: "4,5 mln",     powierzchnia: "1 031 tys. km²"  },
        { panstwo: "Mauritius",                                                      stolica: "Port Louis",     flaga: "🇲🇺", ludnosc: "1,3 mln",     powierzchnia: "2,0 tys. km²"    },
        { panstwo: "Namibia",                                                        stolica: "Windhoek",       flaga: "🇳🇦", ludnosc: "2,6 mln",     powierzchnia: "824,3 tys. km²"  },
        { panstwo: "Niger",                                                          stolica: "Niamej",         stolica_en: "Niamey",            flaga: "🇳🇪", ludnosc: "25,1 mln",    powierzchnia: "1 267 tys. km²"  },
        { panstwo: "Republika Środkowoafrykańska",  panstwo_en: "Central African Republic", stolica: "Bangi", stolica_en: "Bangui",            flaga: "🇨🇫", ludnosc: "5,3 mln",     powierzchnia: "623,0 tys. km²"  },
        { panstwo: "Rwanda",                                                         stolica: "Kigali",         flaga: "🇷🇼", ludnosc: "13,8 mln",    powierzchnia: "26,3 tys. km²"   },
        { panstwo: "Senegal",                                                        stolica: "Dakar",          flaga: "🇸🇳", ludnosc: "17,2 mln",    powierzchnia: "196,7 tys. km²"  },
        { panstwo: "Seszele",                       panstwo_en: "Seychelles",        stolica: "Wiktorja",       stolica_en: "Victoria",          flaga: "🇸🇨", ludnosc: "0,098 mln",   powierzchnia: "0,46 tys. km²"   },
        { panstwo: "Sierra Leone",                                                   stolica: "Freetown",       flaga: "🇸🇱", ludnosc: "8,2 mln",     powierzchnia: "71,7 tys. km²"   },
        { panstwo: "Somalia",                                                        stolica: "Mogadiszu",      stolica_en: "Mogadishu",         flaga: "🇸🇴", ludnosc: "17,1 mln",    powierzchnia: "637,7 tys. km²"  },
        { panstwo: "Sudan Południowy",              panstwo_en: "South Sudan",       stolica: "Dżuba",          stolica_en: "Juba",              flaga: "🇸🇸", ludnosc: "11,4 mln",    powierzchnia: "619,7 tys. km²"  },
        { panstwo: "Togo",                                                           stolica: "Lomé",           flaga: "🇹🇬", ludnosc: "8,5 mln",     powierzchnia: "56,8 tys. km²"   },
        { panstwo: "Tunezja",                       panstwo_en: "Tunisia",           stolica: "Tunis",          flaga: "🇹🇳", ludnosc: "11,8 mln",    powierzchnia: "163,6 tys. km²"  },
        { panstwo: "Uganda",                                                         stolica: "Kampala",        flaga: "🇺🇬", ludnosc: "47,1 mln",    powierzchnia: "241,6 tys. km²"  },
        { panstwo: "Wybrzeże Kości Słoniowej",      panstwo_en: "Ivory Coast",       stolica: "Jamusukro",      stolica_en: "Yamoussoukro",      flaga: "🇨🇮", ludnosc: "27,5 mln",    powierzchnia: "322,5 tys. km²"  },
        { panstwo: "Wyspy Świętego Tomasza i Książęca", panstwo_en: "São Tomé and Príncipe", stolica: "São Tomé", flaga: "🇸🇹", ludnosc: "0,22 mln",  powierzchnia: "0,96 tys. km²"   },
        { panstwo: "Zambia",                                                         stolica: "Lusaka",         flaga: "🇿🇲", ludnosc: "19,5 mln",    powierzchnia: "752,6 tys. km²"  },
        { panstwo: "Zimbabwe",                                                       stolica: "Harare",         flaga: "🇿🇼", ludnosc: "15,9 mln",    powierzchnia: "390,8 tys. km²"  },
    ],
    "Australia i Oceania": [
        { panstwo: "Australia",                                    stolica: "Canberra",     flaga: "🇦🇺", ludnosc: "26,5 mln",   powierzchnia: "7 692 tys. km²" },
        { panstwo: "Nowa Zelandia",  panstwo_en: "New Zealand",   stolica: "Wellington",   flaga: "🇳🇿", ludnosc: "5,1 mln",    powierzchnia: "268,0 tys. km²" },
        { panstwo: "Papua Nowa Gwinea", panstwo_en: "Papua New Guinea", stolica: "Port Moresby", flaga: "🇵🇬", ludnosc: "9,9 mln", powierzchnia: "462,8 tys. km²" },
        { panstwo: "Fidżi",          panstwo_en: "Fiji",           stolica: "Suva",         flaga: "🇫🇯", ludnosc: "0,93 mln",   powierzchnia: "18,3 tys. km²"  },
        { panstwo: "Samoa",                                        stolica: "Apia",         flaga: "🇼🇸", ludnosc: "0,22 mln",   powierzchnia: "2,8 tys. km²"   },
        { panstwo: "Tonga",                                        stolica: "Nukualofa",    stolica_en: "Nuku'alofa",  flaga: "🇹🇴", ludnosc: "0,10 mln", powierzchnia: "0,75 tys. km²"  },
        { panstwo: "Vanuatu",                                      stolica: "Port Vila",    flaga: "🇻🇺", ludnosc: "0,33 mln",   powierzchnia: "12,2 tys. km²"  },
        { panstwo: "Wyspy Salomona", panstwo_en: "Solomon Islands", stolica: "Honiara",    flaga: "🇸🇧", ludnosc: "0,72 mln",   powierzchnia: "28,9 tys. km²"  },
    ],
};

// Add virtual mapa field (same as panstwo – used as comparison key for map questions)
Object.values(COUNTRIES).flat().forEach(c => { c.mapa = c.panstwo; });

// ─── Map Data ─────────────────────────────────────────────────────────────────
const COUNTRY_CONTINENT = {
    "Polska": "Europa", "Niemcy": "Europa", "Francja": "Europa", "Włochy": "Europa",
    "Hiszpania": "Europa", "Wielka Brytania": "Europa", "Holandia": "Europa",
    "Belgia": "Europa", "Szwecja": "Europa", "Norwegia": "Europa", "Dania": "Europa",
    "Finlandia": "Europa", "Portugalia": "Europa", "Grecja": "Europa",
    "Austria": "Europa", "Szwajcaria": "Europa", "Czechy": "Europa",
    "Węgry": "Europa", "Rumunia": "Europa", "Ukraina": "Europa",
    "Albania": "Europa", "Andora": "Europa", "Armenia": "Europa", "Azerbejdżan": "Europa",
    "Białoruś": "Europa", "Bośnia i Hercegowina": "Europa", "Bułgaria": "Europa",
    "Chorwacja": "Europa", "Cypr": "Europa", "Czarnogóra": "Europa", "Estonia": "Europa",
    "Gruzja": "Europa", "Irlandia": "Europa", "Islandia": "Europa", "Kosowo": "Europa",
    "Liechtenstein": "Europa", "Litwa": "Europa", "Luksemburg": "Europa", "Łotwa": "Europa",
    "Macedonia Północna": "Europa", "Malta": "Europa", "Mołdawia": "Europa", "Monako": "Europa",
    "Rosja": "Europa", "San Marino": "Europa", "Serbia": "Europa", "Słowacja": "Europa",
    "Słowenia": "Europa", "Watykan": "Europa",
    "Chiny": "Azja", "Indie": "Azja", "Japonia": "Azja", "Korea Południowa": "Azja",
    "Indonezja": "Azja", "Wietnam": "Azja", "Tajlandia": "Azja",
    "Arabia Saudyjska": "Azja", "Iran": "Azja", "Irak": "Azja", "Turcja": "Azja",
    "Pakistan": "Azja", "Bangladesz": "Azja", "Malezja": "Azja", "Filipiny": "Azja",
    "Stany Zjednoczone": "Ameryka Północna", "Kanada": "Ameryka Północna",
    "Meksyk": "Ameryka Północna", "Kuba": "Ameryka Północna",
    "Gwatemala": "Ameryka Północna", "Honduras": "Ameryka Północna",
    "Nikaragua": "Ameryka Północna", "Kostaryka": "Ameryka Północna",
    "Panama": "Ameryka Północna", "Jamajka": "Ameryka Północna",
    "Brazylia": "Ameryka Południowa", "Argentyna": "Ameryka Południowa",
    "Kolumbia": "Ameryka Południowa", "Peru": "Ameryka Południowa",
    "Wenezuela": "Ameryka Południowa", "Chile": "Ameryka Południowa",
    "Boliwia": "Ameryka Południowa", "Paragwaj": "Ameryka Południowa",
    "Urugwaj": "Ameryka Południowa", "Ekwador": "Ameryka Południowa",
    "Nigeria": "Afryka", "Etiopia": "Afryka", "Egipt": "Afryka", "Kongo": "Afryka",
    "Tanzania": "Afryka", "Kenia": "Afryka", "Algieria": "Afryka", "Maroko": "Afryka",
    "Mozambik": "Afryka", "Ghana": "Afryka", "RPA": "Afryka", "Sudan": "Afryka",
    "Angola": "Afryka", "Benin": "Afryka", "Botswana": "Afryka", "Burkina Faso": "Afryka",
    "Burundi": "Afryka", "Cabo Verde": "Afryka", "Czad": "Afryka", "Dżibuti": "Afryka",
    "Erytrea": "Afryka", "Eswatini": "Afryka", "Gabon": "Afryka", "Gambia": "Afryka",
    "Gwinea": "Afryka", "Gwinea Bissau": "Afryka", "Gwinea Równikowa": "Afryka",
    "Kamerun": "Afryka", "Komory": "Afryka", "Lesotho": "Afryka", "Liberia": "Afryka",
    "Libia": "Afryka", "Madagaskar": "Afryka", "Malawi": "Afryka", "Mali": "Afryka",
    "Mauretania": "Afryka", "Mauritius": "Afryka", "Namibia": "Afryka", "Niger": "Afryka",
    "Republika Środkowoafrykańska": "Afryka", "Rwanda": "Afryka", "Senegal": "Afryka",
    "Seszele": "Afryka", "Sierra Leone": "Afryka", "Somalia": "Afryka",
    "Sudan Południowy": "Afryka", "Togo": "Afryka", "Tunezja": "Afryka",
    "Uganda": "Afryka", "Wybrzeże Kości Słoniowej": "Afryka",
    "Wyspy Świętego Tomasza i Książęca": "Afryka", "Zambia": "Afryka", "Zimbabwe": "Afryka",
    "Afganistan": "Azja", "Bahrajn": "Azja", "Bhutan": "Azja", "Brunei": "Azja",
    "Izrael": "Azja", "Jemen": "Azja", "Jordania": "Azja", "Kambodża": "Azja",
    "Katar": "Azja", "Kazachstan": "Azja", "Kirgistan": "Azja", "Korea Północna": "Azja",
    "Kuwejt": "Azja", "Laos": "Azja", "Liban": "Azja", "Malediwy": "Azja",
    "Mjanma": "Azja", "Mongolia": "Azja", "Nepal": "Azja", "Oman": "Azja",
    "Palestyna": "Azja", "Singapur": "Azja", "Sri Lanka": "Azja", "Syria": "Azja",
    "Tadżykistan": "Azja", "Timor Wschodni": "Azja", "Turkmenistan": "Azja",
    "Uzbekistan": "Azja", "Zjednoczone Emiraty Arabskie": "Azja",
    "Australia": "Australia i Oceania", "Nowa Zelandia": "Australia i Oceania",
    "Papua Nowa Gwinea": "Australia i Oceania", "Fidżi": "Australia i Oceania",
    "Samoa": "Australia i Oceania", "Tonga": "Australia i Oceania",
    "Vanuatu": "Australia i Oceania", "Wyspy Salomona": "Australia i Oceania",
};

// Pre-projected centroid coordinates [x, y] within each continent's 300×220 SVG viewport
const CENTROIDS_SVG = {
    "Polska": [183.1, 114.6], "Niemcy": [147.6, 119.2], "Francja": [115.3, 144.7],
    "Włochy": [157.1, 162.0], "Hiszpania": [92.0, 173.8], "Wielka Brytania": [96.8, 104.9],
    "Holandia": [127.5, 113.6], "Belgia": [124.4, 122.8], "Szwecja": [165.8, 64.1],
    "Norwegia": [157.9, 48.8], "Dania": [146.1, 94.7], "Finlandia": [209.2, 48.8],
    "Portugalia": [75.1, 178.8], "Grecja": [192.6, 180.9], "Austria": [164.2, 138.0],
    "Szwajcaria": [139.0, 140.6], "Czechy": [167.8, 126.3], "Węgry": [183.5, 139.6],
    "Rumunia": [204.8, 146.2], "Ukraina": [230.9, 130.4],
    "Albania": [193.0, 173.0], "Andora": [107.0, 155.0], "Armenia": [270.0, 160.0],
    "Azerbejdżan": [278.0, 155.0], "Białoruś": [213.0, 108.0], "Bośnia i Hercegowina": [174.0, 157.0],
    "Bułgaria": [205.0, 161.0], "Chorwacja": [170.0, 150.0], "Cypr": [235.0, 192.0],
    "Czarnogóra": [182.0, 165.0], "Estonia": [214.0, 72.0], "Gruzja": [262.0, 153.0],
    "Irlandia": [76.0, 100.0], "Islandia": [35.0, 38.0], "Kosowo": [194.0, 166.0],
    "Liechtenstein": [148.0, 138.0], "Litwa": [206.0, 88.0], "Luksemburg": [131.0, 124.0],
    "Łotwa": [210.0, 79.0], "Macedonia Północna": [198.0, 169.0], "Malta": [158.0, 195.0],
    "Mołdawia": [218.0, 143.0], "Monako": [130.0, 153.0], "Rosja": [260.0, 90.0],
    "San Marino": [161.0, 156.0], "Serbia": [188.0, 156.0], "Słowacja": [179.0, 128.0],
    "Słowenia": [164.0, 145.0], "Watykan": [156.0, 163.0],
    "Chiny": [185.9, 103.4], "Indie": [130.3, 138.1], "Japonia": [261.6, 102.7],
    "Korea Południowa": [238.5, 102.1], "Indonezja": [216.6, 190.5],
    "Wietnam": [190.6, 147.2], "Tajlandia": [178.8, 148.8],
    "Arabia Saudyjska": [54.8, 129.9], "Iran": [73.9, 111.4], "Irak": [51.7, 109.5],
    "Turcja": [33.5, 96.2], "Pakistan": [108.5, 115.9], "Bangladesz": [155.3, 131.1],
    "Malezja": [204.4, 179.1], "Filipiny": [225.4, 155.6],
    "Stany Zjednoczone": [176.6, 125.5], "Kanada": [184.4, 72.6],
    "Meksyk": [166.9, 166.6], "Kuba": [218.7, 172.0], "Gwatemala": [195.3, 186.7],
    "Honduras": [204.5, 188.2], "Nikaragua": [206.8, 194.2], "Kostaryka": [210.0, 202.4],
    "Panama": [218.5, 205.8], "Jamajka": [224.9, 180.8],
    "Brazylia": [175.1, 76.0], "Argentyna": [113.8, 144.0], "Kolumbia": [64.2, 36.0],
    "Peru": [52.5, 73.7], "Wenezuela": [102.1, 24.7], "Chile": [72.0, 148.8],
    "Boliwia": [112.7, 93.8], "Paragwaj": [145.0, 114.0], "Urugwaj": [159.5, 139.8],
    "Ekwador": [34.7, 52.8],
    "Nigeria": [118.8, 86.6], "Etiopia": [246.0, 86.6], "Egipt": [207.2, 38.5],
    "Kongo": [171.2, 122.2], "Tanzania": [223.6, 128.8], "Kenia": [235.6, 111.4],
    "Algieria": [90.8, 35.2], "Maroko": [55.6, 24.9], "Mozambik": [226.0, 162.2],
    "Ghana": [80.0, 89.9], "RPA": [184.4, 190.2], "Sudan": [214.0, 68.9],
    "Angola": [155.0, 150.0], "Benin": [108.0, 90.0], "Botswana": [185.0, 173.0],
    "Burkina Faso": [93.0, 72.0], "Burundi": [210.0, 130.0], "Cabo Verde": [25.0, 72.0],
    "Czad": [168.0, 55.0], "Dżibuti": [260.0, 80.0], "Erytrea": [248.0, 65.0],
    "Eswatini": [215.0, 180.0], "Gabon": [143.0, 115.0], "Gambia": [47.0, 78.0],
    "Gwinea": [62.0, 90.0], "Gwinea Bissau": [52.0, 83.0], "Gwinea Równikowa": [135.0, 110.0],
    "Kamerun": [148.0, 92.0], "Komory": [240.0, 150.0], "Lesotho": [192.0, 185.0],
    "Liberia": [65.0, 102.0], "Libia": [150.0, 32.0], "Madagaskar": [255.0, 160.0],
    "Malawi": [215.0, 152.0], "Mali": [90.0, 55.0], "Mauretania": [65.0, 40.0],
    "Mauritius": [280.0, 165.0], "Namibia": [157.0, 170.0], "Niger": [130.0, 55.0],
    "Republika Środkowoafrykańska": [180.0, 95.0], "Rwanda": [205.0, 120.0],
    "Senegal": [52.0, 73.0], "Seszele": [278.0, 110.0], "Sierra Leone": [60.0, 98.0],
    "Somalia": [265.0, 100.0], "Sudan Południowy": [215.0, 88.0], "Togo": [100.0, 88.0],
    "Tunezja": [140.0, 22.0], "Uganda": [217.0, 108.0],
    "Wybrzeże Kości Słoniowej": [78.0, 98.0], "Wyspy Świętego Tomasza i Książęca": [128.0, 110.0],
    "Zambia": [185.0, 155.0], "Zimbabwe": [195.0, 168.0],
    "Afganistan": [95.0, 108.0], "Bahrajn": [57.0, 120.0], "Bhutan": [154.0, 126.0],
    "Brunei": [215.0, 168.0], "Izrael": [30.0, 108.0], "Jemen": [60.0, 137.0],
    "Jordania": [33.0, 113.0], "Kambodża": [190.0, 158.0], "Katar": [57.0, 123.0],
    "Kazachstan": [110.0, 82.0], "Kirgistan": [117.0, 96.0], "Korea Północna": [234.0, 95.0],
    "Kuwejt": [55.0, 114.0], "Laos": [185.0, 148.0], "Liban": [28.0, 106.0],
    "Malediwy": [120.0, 165.0], "Mjanma": [167.0, 140.0], "Mongolia": [185.0, 86.0],
    "Nepal": [142.0, 125.0], "Oman": [72.0, 132.0], "Palestyna": [29.0, 110.0],
    "Singapur": [198.0, 177.0], "Sri Lanka": [130.0, 158.0], "Syria": [34.0, 103.0],
    "Tadżykistan": [102.0, 101.0], "Timor Wschodni": [234.0, 185.0],
    "Turkmenistan": [85.0, 99.0], "Uzbekistan": [97.0, 93.0],
    "Zjednoczone Emiraty Arabskie": [68.0, 127.0],
    "Australia": [101.9, 145.8], "Nowa Zelandia": [243.9, 193.1],
    "Papua Nowa Gwinea": [138.7, 90.5], "Fidżi": [263.2, 123.7],
    "Samoa": [292.0, 112.3], "Tonga": [287.6, 131.9],
    "Vanuatu": [222.5, 117.0], "Wyspy Salomona": [198.1, 100.1],
};

// Simplified continent outline SVG paths (300×220 viewport)
const CONTINENT_PATHS = {
    "Europa": "M57.9,201.6 L48.9,203.1 L53.3,193.0 L50.1,191.4 L50.9,191.4 L52.0,190.6 L53.4,188.3 L49.0,190.4 L56.9,176.9 L58.8,166.3 L56.7,161.0 L65.6,156.8 L95.8,158.7 L100.2,145.7 L102.3,149.7 L102.5,149.1 L100.7,141.3 L96.4,138.3 L98.6,136.0 L86.4,132.4 L84.9,131.1 L87.8,129.6 L85.2,128.3 L101.4,127.9 L99.5,121.9 L103.0,124.0 L107.1,124.5 L110.3,123.5 L116.1,119.8 L116.7,115.8 L128.0,114.4 L124.4,113.0 L127.9,113.6 L127.5,112.3 L126.3,111.6 L133.9,104.6 L145.5,104.9 L146.1,102.4 L148.5,102.6 L149.6,103.9 L150.6,104.2 L145.9,100.4 L147.5,99.6 L144.0,92.3 L144.1,90.3 L144.4,89.7 L146.1,90.8 L147.6,89.5 L147.6,90.5 L148.6,90.8 L150.7,88.7 L147.8,88.4 L146.2,88.8 L145.2,89.8 L145.8,89.9 L145.7,90.3 L144.5,89.7 L145.8,88.1 L148.9,88.1 L150.8,86.4 L151.7,86.5 L152.9,86.0 L153.3,86.0 L150.4,90.4 L154.7,91.6 L149.5,94.4 L149.1,98.4 L150.7,99.9 L156.7,102.8 L162.5,100.7 L162.8,101.4 L164.1,102.3 L165.4,102.3 L165.2,102.6 L165.8,103.1 L165.4,103.3 L165.4,103.4 L168.3,104.7 L165.2,102.1 L180.2,99.8 L184.4,101.9 L189.3,96.6 L187.9,99.6 L190.2,99.8 L188.5,93.3 L190.1,89.6 L198.3,91.3 L197.8,87.4 L195.5,87.1 L194.0,84.0 L211.3,83.3 L206.6,80.3 L201.5,80.0 L191.9,81.7 L192.0,79.9 L187.0,78.6 L187.1,75.6 L184.3,71.8 L184.9,70.1 L186.4,70.5 L187.2,70.2 L193.6,66.6 L190.6,63.7 L185.3,62.7 L182.2,63.6 L184.0,66.4 L182.1,68.0 L173.3,70.7 L174.1,76.8 L176.6,77.5 L179.5,80.7 L180.6,80.8 L177.5,81.7 L177.8,82.1 L178.2,82.1 L179.0,81.8 L179.5,82.2 L178.4,82.1 L177.4,83.7 L176.5,82.5 L172.0,84.1 L174.6,84.9 L172.9,84.8 L174.3,88.8 L172.0,94.2 L171.1,93.6 L168.1,93.6 L166.4,96.8 L161.6,96.5 L162.4,95.2 L160.1,92.5 L161.7,91.6 L157.1,86.5 L157.5,84.0 L155.2,83.7 L155.8,81.2 L153.2,80.1 L152.8,77.4 L151.7,80.6 L143.9,83.7 L134.2,80.7 L138.2,79.3 L135.4,79.0 L137.8,77.2 L133.9,78.0 L132.7,76.7 L139.8,73.7 L134.7,75.1 L134.7,73.6 L132.4,73.5 L134.4,73.4 L134.6,73.2 L134.7,72.3 L131.9,70.7 L139.7,72.3 L141.8,71.1 L132.5,70.5 L134.8,69.4 L131.6,68.0 L132.3,68.1 L133.1,67.5 L135.0,68.4 L138.4,68.3 L137.2,68.4 L135.2,67.8 L133.3,67.4 L132.2,67.5 L133.1,67.1 L131.9,66.3 L136.7,67.4 L135.0,66.6 L137.8,66.1 L138.8,67.5 L139.1,67.6 L139.5,67.6 L139.7,67.6 L140.5,67.2 L138.1,66.1 L136.1,65.9 L137.7,66.0 L136.1,65.5 L142.9,65.9 L141.2,65.4 L139.9,65.4 L138.7,65.3 L138.6,65.2 L139.6,64.3 L140.5,64.8 L142.6,65.0 L142.9,65.5 L144.3,66.3 L142.8,65.0 L141.8,64.7 L142.6,64.4 L143.5,65.4 L144.8,65.7 L142.8,64.4 L145.5,64.5 L144.5,63.6 L146.0,64.3 L147.1,64.1 L147.9,63.3 L148.5,64.5 L152.1,64.6 L153.8,63.0 L147.3,62.8 L149.5,62.6 L150.2,61.1 L152.8,61.8 L155.6,60.3 L152.5,60.1 L155.5,60.1 L155.4,60.0 L156.8,59.9 L157.6,59.5 L155.5,59.4 L157.1,59.0 L156.4,57.5 L158.0,58.0 L157.4,57.2 L156.3,57.1 L159.8,57.4 L160.7,57.1 L157.4,56.9 L159.8,55.6 L158.4,55.0 L164.8,55.5 L160.5,54.5 L164.9,54.5 L161.3,53.2 L164.5,53.6 L164.9,53.4 L164.4,53.1 L164.1,53.2 L163.6,53.0 L163.4,52.9 L163.0,53.0 L162.6,52.9 L164.5,52.7 L164.9,53.3 L165.3,53.6 L165.6,53.8 L166.4,54.2 L164.8,52.7 L169.7,53.5 L165.6,52.3 L168.9,52.7 L167.5,52.1 L169.1,52.5 L169.3,50.9 L173.2,52.3 L171.3,51.0 L174.5,51.1 L174.4,52.5 L176.9,51.6 L179.3,52.7 L177.1,51.0 L178.2,51.6 L180.8,52.2 L179.4,52.1 L182.1,53.0 L183.7,51.6 L186.8,52.6 L186.2,53.8 L191.4,53.6 L191.0,54.2 L192.3,54.4 L192.6,55.5 L193.0,54.4 L198.5,56.7 L193.7,55.7 L196.4,57.2 L201.1,58.0 L203.6,59.1 L202.3,59.2 L204.9,59.9 L205.3,60.3 L204.6,60.3 L204.7,60.6 L209.6,61.5 L221.1,66.8 L223.0,68.6 L220.0,69.2 L211.6,66.5 L207.6,64.5 L206.4,64.1 L205.3,63.9 L213.4,68.1 L213.1,69.1 L215.3,71.3 L221.8,74.2 L222.1,73.1 L218.1,71.0 L226.2,73.3 L225.7,72.8 L223.0,70.7 L225.2,69.6 L229.5,71.6 L227.8,69.6 L226.0,68.7 L225.3,67.5 L222.5,66.0 L227.9,68.2 L227.4,68.9 L230.8,70.6 L232.1,70.0 L230.8,69.3 L233.8,70.1 L233.0,69.6 L233.5,69.7 L234.0,69.9 L233.4,69.7 L235.0,70.5 L234.7,70.5 L236.3,71.2 L236.8,71.5 L239.1,72.5 L238.1,72.3 L235.8,71.2 L235.4,71.2 L237.3,72.6 L242.2,75.1 L239.7,74.6 L237.9,73.8 L237.3,73.3 L237.7,73.4 L234.0,72.6 L233.0,72.2 L231.0,72.4 L226.6,72.2 L226.3,73.2 L245.7,77.0 L247.4,77.3 L247.1,77.1 L246.9,77.1 L246.7,77.1 L247.0,77.1 L246.4,76.8 L246.5,76.7 L247.4,77.1 L248.4,77.8 L283.0,99.5 L282.6,99.9 L279.7,97.1 L278.3,97.1 L278.5,100.8 L275.4,102.2 L275.9,103.5 L278.5,105.2 L277.3,105.5 L278.7,107.4 L278.2,108.8 L281.6,110.6 L281.8,112.8 L280.6,113.8 L277.7,111.9 L275.1,114.6 L272.7,113.1 L273.4,114.9 L270.0,111.8 L265.3,111.3 L263.0,115.8 L264.5,118.4 L261.3,116.9 L261.9,124.9 L266.3,127.3 L269.1,131.0 L268.1,131.6 L268.4,132.0 L269.3,132.2 L270.4,133.0 L267.0,135.8 L267.0,141.9 L269.5,145.9 L269.4,144.2 L269.8,144.1 L271.1,149.7 L277.1,158.4 L278.8,158.8 L279.4,160.0 L277.5,160.9 L277.7,169.9 L275.3,168.4 L274.4,163.9 L271.7,169.0 L268.8,168.9 L263.5,164.2 L260.3,157.2 L257.0,158.0 L255.8,152.0 L241.2,141.9 L244.3,141.0 L245.9,137.1 L243.2,134.6 L246.6,131.6 L236.2,138.1 L237.0,136.8 L236.5,136.0 L235.7,137.7 L237.6,141.3 L241.3,141.1 L234.2,146.5 L229.4,141.9 L232.7,139.4 L232.3,138.1 L226.9,137.8 L225.9,136.5 L228.4,136.9 L229.2,135.9 L226.3,133.2 L227.0,136.1 L223.9,136.7 L220.6,140.6 L221.0,145.4 L218.6,145.1 L218.1,152.7 L214.6,158.4 L216.6,160.9 L211.8,161.5 L210.1,168.5 L206.8,167.3 L201.7,169.2 L204.1,172.4 L201.7,171.5 L202.6,173.7 L197.5,171.2 L200.1,178.5 L197.0,180.7 L202.7,184.2 L202.4,187.4 L200.8,185.2 L198.5,186.4 L200.4,188.9 L197.4,188.5 L198.9,195.3 L193.3,193.6 L191.3,187.3 L199.5,184.6 L191.4,184.4 L191.5,183.3 L190.7,181.8 L190.2,181.7 L191.9,180.4 L185.1,172.6 L186.6,164.4 L176.5,156.1 L174.8,155.4 L172.9,155.7 L169.9,152.0 L171.4,151.5 L169.5,149.9 L169.0,147.1 L167.8,145.9 L166.9,145.8 L165.2,149.0 L164.1,143.4 L159.4,144.9 L158.3,146.2 L158.9,152.3 L167.6,164.2 L173.2,164.8 L172.2,167.4 L182.0,174.6 L175.7,173.3 L173.8,177.4 L176.3,181.7 L171.1,189.0 L169.4,188.7 L172.3,183.1 L170.4,175.9 L152.7,163.2 L149.6,154.2 L143.8,151.6 L131.7,160.2 L126.9,157.2 L118.5,159.5 L117.2,167.7 L104.4,175.0 L97.9,183.7 L99.7,188.8 L85.3,203.2 L73.3,204.0 L65.8,209.5 L64.1,203.0 L57.9,201.6 Z M86.1,95.2 L80.5,107.8 L65.4,110.9 L64.6,109.3 L61.5,110.1 L64.7,108.7 L60.6,108.6 L69.4,104.6 L63.5,104.9 L69.2,101.6 L63.1,100.2 L66.4,98.4 L64.6,97.8 L65.4,97.5 L63.9,96.6 L64.6,95.6 L71.8,96.6 L74.0,94.4 L70.8,93.9 L78.0,90.9 L86.1,95.2 Z M82.1,81.0 L84.2,80.2 L84.7,82.1 L85.9,82.5 L87.0,82.5 L85.3,83.5 L82.1,81.0 Z M83.5,79.0 L82.0,79.0 L81.2,77.3 L81.9,78.0 L85.2,76.9 L83.5,79.0 Z M48.5,38.3 L54.7,44.1 L47.7,46.4 L46.3,46.2 L46.4,46.0 L45.8,45.9 L45.7,45.6 L45.5,45.5 L45.2,45.4 L38.5,47.1 L34.0,46.5 L28.7,47.5 L9.0,42.8 L15.7,40.0 L2.9,37.0 L15.4,36.4 L0.9,34.0 L7.5,34.2 L4.7,32.9 L8.1,33.6 L5.1,32.4 L7.1,31.8 L12.4,34.0 L9.8,31.2 L17.7,34.4 L15.2,35.0 L18.3,38.1 L23.4,34.8 L33.5,38.4 L32.7,36.0 L50.4,38.1 L48.5,38.3 Z M115.3,180.0 L114.1,184.6 L111.0,182.7 L115.3,180.0 Z M98.8,110.8 L85.3,109.7 L92.1,106.4 L88.5,105.0 L91.5,102.9 L96.7,102.1 L97.4,102.8 L98.3,102.6 L98.3,98.0 L94.7,96.5 L97.7,94.4 L88.0,94.2 L90.5,87.9 L87.3,88.5 L87.7,89.7 L85.4,91.9 L86.9,87.0 L89.7,85.3 L86.5,86.1 L84.1,84.8 L88.0,83.3 L86.5,79.8 L89.9,80.1 L88.3,78.8 L90.6,76.5 L99.2,77.3 L93.4,81.9 L104.0,82.4 L97.0,87.6 L100.2,88.3 L94.6,88.7 L102.0,90.1 L110.3,99.4 L109.6,99.8 L111.0,101.8 L111.0,102.0 L110.9,102.1 L109.3,101.2 L107.7,101.2 L107.3,101.3 L111.3,102.9 L110.1,105.5 L117.6,107.2 L111.1,113.0 L112.4,112.9 L111.8,113.2 L112.6,113.2 L112.7,113.5 L113.6,113.6 L115.7,113.5 L113.4,115.8 L102.4,115.5 L97.7,117.4 L93.1,116.4 L82.0,119.5 L89.9,113.5 L95.5,113.8 L98.8,110.8 Z M145.2,171.0 L144.0,183.5 L139.7,185.6 L139.2,172.5 L145.2,171.0 Z M144.0,169.7 L142.6,162.5 L146.1,159.9 L144.0,169.7 Z M153.6,95.1 L151.2,97.0 L150.0,95.3 L153.6,95.1 Z M160.7,93.7 L158.5,99.9 L158.0,97.3 L154.5,94.5 L160.7,93.7 Z M142.7,28.3 L139.5,26.8 L137.3,25.5 L142.7,28.3 Z M169.2,187.4 L166.3,197.5 L155.6,191.2 L157.2,188.6 L169.2,187.4 Z M165.0,101.5 L163.0,101.4 L162.9,100.3 L164.0,99.7 L165.0,101.5 Z M175.5,90.0 L174.3,93.3 L173.9,93.8 L173.7,92.3 L175.5,90.0 Z M165.6,52.1 L163.0,51.7 L162.8,51.9 L161.9,52.1 L161.6,52.0 L163.1,51.5 L162.9,50.6 L165.6,52.1 Z M167.3,50.1 L169.1,51.5 L165.9,51.0 L167.3,50.1 Z M160.5,34.7 L155.8,34.8 L153.2,33.6 L155.6,34.3 L148.2,31.0 L154.2,33.3 L150.2,31.6 L156.0,33.6 L155.5,33.2 L148.1,30.8 L146.7,29.9 L148.7,30.7 L155.4,32.8 L150.1,30.4 L144.9,29.1 L139.5,26.3 L142.7,27.5 L140.3,26.4 L141.1,26.5 L137.0,24.7 L144.7,27.4 L141.6,26.5 L146.2,28.5 L146.7,28.2 L152.6,31.3 L149.4,29.4 L150.5,29.6 L155.3,31.8 L154.8,31.8 L156.0,32.2 L158.1,33.3 L164.4,36.2 L160.5,34.7 Z M178.9,88.8 L181.5,89.6 L179.3,91.3 L178.9,88.8 Z M171.4,50.7 L170.8,51.0 L168.8,50.5 L171.4,50.7 Z M172.8,50.6 L171.6,50.7 L170.3,50.1 L172.8,50.6 Z M164.4,36.5 L162.0,35.4 L167.0,37.5 L164.4,36.5 Z M204.1,185.3 L202.6,182.8 L198.2,180.6 L203.0,181.3 L204.1,185.3 Z M194.1,86.7 L190.8,88.3 L189.8,86.1 L192.9,85.9 L194.1,86.7 Z M190.1,84.6 L191.9,84.3 L193.1,85.2 L190.1,84.6 Z M178.6,51.1 L177.8,50.6 L179.7,51.2 L179.5,50.9 L181.3,51.2 L180.6,51.4 L178.6,51.1 Z M172.1,39.9 L169.6,39.3 L165.0,37.2 L166.2,37.5 L164.2,36.5 L168.4,38.2 L172.1,39.9 Z M173.3,40.0 L169.0,38.0 L153.9,31.0 L158.4,32.9 L157.5,32.4 L164.0,35.5 L164.0,35.4 L173.3,40.0 Z M235.2,197.6 L232.7,201.1 L231.4,198.8 L235.2,197.6 Z M210.2,201.7 L204.3,203.9 L199.8,202.2 L200.8,199.7 L210.2,201.7 Z M180.1,43.3 L176.9,41.8 L177.7,42.2 L180.1,43.3 Z M246.9,77.0 L247.6,77.2 L246.5,76.7 L246.9,77.0 Z M229.7,68.1 L229.6,68.2 L228.2,67.7 L227.5,67.0 L229.7,68.1 Z M235.5,71.2 L235.2,70.9 L233.1,69.9 L232.8,69.9 L235.5,71.2 Z M226.5,66.4 L227.6,66.9 L226.0,66.1 L226.2,66.3 L226.5,66.4 Z M224.9,65.5 L221.8,64.8 L223.6,66.3 L225.1,66.3 L226.6,66.9 L231.3,69.1 L228.4,67.2 L228.1,67.3 L226.3,66.4 L224.9,65.5 Z M225.7,73.1 L226.0,72.6 L226.2,72.4 L224.3,72.6 L225.1,72.7 L225.1,72.9 L224.7,72.9 L225.7,73.1 Z M219.6,65.6 L217.9,64.7 L215.8,67.2 L213.6,71.5 L220.4,66.3 L221.6,66.8 L221.8,65.9 L222.9,66.6 L223.7,66.5 L220.5,64.5 L219.6,65.6 Z M200.5,59.2 L200.7,59.9 L201.4,60.3 L201.5,60.2 L200.5,59.2 Z M202.5,63.4 L201.9,64.3 L202.5,64.4 L202.5,63.4 Z M203.0,65.0 L201.6,64.3 L202.3,65.9 L203.0,65.0 Z M200.7,60.8 L200.8,61.6 L201.4,62.0 L200.7,60.8 Z M199.2,60.4 L199.2,57.9 L197.4,56.5 L199.2,60.4 Z M197.8,58.1 L195.1,55.0 L196.4,57.1 L197.8,58.1 Z M201.2,68.0 L202.1,67.2 L201.2,66.0 L200.4,67.7 L201.2,68.0 Z M200.3,62.8 L199.7,62.1 L200.3,63.6 L200.3,62.8 Z M199.3,62.5 L199.9,64.1 L200.6,64.9 L199.3,62.5 Z M199.9,68.8 L199.5,70.4 L200.5,68.3 L199.9,68.8 Z M200.4,64.8 L199.4,63.7 L200.3,65.3 L200.4,64.8 Z M199.6,67.9 L200.3,67.3 L200.1,66.6 L199.7,67.1 L199.6,67.9 Z M198.7,63.3 L198.5,64.3 L199.0,65.1 L199.2,64.0 L198.7,63.3 Z M198.3,64.3 L198.1,65.1 L198.6,65.7 L198.3,64.3 Z M197.6,65.2 L197.2,65.5 L197.3,66.5 L197.6,65.2 Z",
    "Azja": "M73.1,149.3 L72.3,150.0 L71.2,149.4 L73.1,149.3 Z M69.7,141.6 L68.1,143.4 L59.9,145.9 L47.5,147.7 L44.0,138.4 L36.2,130.8 L34.4,125.4 L32.0,124.1 L31.6,122.5 L26.9,116.4 L25.3,116.3 L26.5,113.5 L24.8,109.8 L29.8,103.6 L30.8,99.2 L22.4,100.1 L17.5,97.9 L14.8,99.3 L12.1,97.5 L11.0,98.0 L9.4,97.7 L11.8,97.1 L9.2,97.1 L9.4,95.0 L7.0,94.2 L9.4,94.0 L9.2,91.7 L7.0,91.7 L9.0,90.0 L14.6,90.5 L16.9,90.0 L15.2,88.8 L20.1,89.5 L29.5,88.1 L37.2,91.2 L48.1,90.6 L49.6,93.8 L53.5,96.3 L56.1,96.8 L59.7,95.3 L61.9,99.7 L68.1,102.3 L73.1,102.1 L73.5,97.9 L71.7,97.2 L73.1,96.6 L72.9,95.7 L71.6,96.1 L70.9,94.9 L71.7,93.3 L73.4,94.4 L76.0,93.7 L73.8,91.3 L72.0,91.6 L71.6,93.4 L71.8,90.0 L68.5,88.8 L66.5,86.1 L69.7,86.1 L68.4,85.3 L69.7,84.3 L73.9,84.7 L72.8,84.1 L73.8,81.3 L69.8,80.7 L60.4,82.9 L58.3,85.3 L59.6,87.5 L60.1,86.8 L60.4,86.8 L59.6,88.5 L61.8,91.1 L59.8,92.3 L54.0,88.8 L41.9,86.4 L34.6,82.2 L39.7,80.7 L38.0,79.3 L42.1,78.7 L39.3,78.0 L43.3,77.2 L45.0,73.7 L34.6,71.2 L33.8,69.3 L31.7,69.1 L31.4,66.7 L26.3,66.8 L25.6,64.8 L29.4,64.2 L25.5,61.0 L26.3,59.3 L20.3,57.8 L19.2,55.9 L19.9,51.8 L22.0,49.8 L27.6,49.8 L24.4,47.9 L22.1,48.1 L32.8,43.8 L29.7,41.7 L31.4,40.8 L29.7,39.1 L31.5,37.5 L29.9,34.7 L32.9,33.2 L30.1,31.8 L30.1,30.2 L39.6,28.6 L42.0,29.4 L39.5,29.8 L42.6,30.1 L42.5,30.6 L41.3,30.8 L41.1,31.0 L48.0,31.1 L58.8,35.4 L58.4,37.3 L51.7,38.4 L42.5,36.6 L39.3,35.0 L38.1,34.8 L36.8,34.7 L42.9,38.0 L41.2,39.0 L41.6,40.9 L47.6,43.1 L49.1,42.1 L45.9,40.5 L55.1,42.1 L55.3,41.6 L54.1,39.7 L60.6,38.1 L64.7,39.9 L66.3,37.7 L64.8,36.8 L67.0,35.2 L64.9,33.7 L71.9,35.4 L67.6,36.8 L70.5,38.4 L77.4,36.9 L76.5,36.2 L85.5,36.0 L85.6,35.3 L89.4,34.8 L91.0,34.9 L88.7,34.9 L89.1,36.1 L87.3,36.2 L90.9,36.7 L100.7,35.5 L102.0,37.1 L105.4,36.1 L104.0,34.5 L106.0,34.0 L112.9,35.1 L121.1,38.6 L123.8,37.1 L121.8,35.7 L119.5,35.2 L118.9,35.4 L121.0,32.9 L119.7,32.2 L124.0,31.1 L127.3,28.4 L132.1,28.8 L134.7,29.4 L131.4,31.9 L133.2,33.4 L131.1,37.5 L133.0,38.4 L133.1,38.7 L126.8,41.7 L127.2,42.3 L125.2,42.5 L124.4,42.2 L125.3,42.1 L125.4,42.0 L124.4,42.1 L123.7,41.7 L121.6,41.7 L123.3,42.7 L128.0,43.3 L134.9,40.5 L135.5,38.1 L139.9,37.9 L141.2,39.0 L140.1,40.6 L141.2,41.2 L144.2,41.3 L141.0,40.7 L142.8,39.6 L142.2,38.2 L133.9,37.2 L133.8,35.9 L136.3,34.0 L134.1,32.2 L138.9,30.9 L139.0,29.4 L140.9,30.0 L138.9,32.6 L142.3,33.4 L145.4,34.0 L146.7,34.0 L147.0,33.8 L140.9,31.5 L145.5,31.8 L144.1,31.2 L146.8,30.7 L156.4,32.7 L153.0,35.1 L153.3,35.9 L155.1,34.2 L153.9,36.0 L154.8,36.3 L156.6,35.5 L155.7,34.0 L157.1,32.9 L151.6,30.6 L152.1,28.4 L166.3,28.4 L163.3,29.1 L163.2,29.5 L165.0,30.3 L163.4,29.2 L166.3,29.0 L167.6,28.4 L164.3,27.2 L167.1,27.4 L166.3,26.9 L164.1,26.6 L166.7,26.8 L168.8,25.9 L167.3,25.6 L169.2,25.8 L183.0,24.5 L180.2,24.3 L182.2,24.0 L187.7,24.8 L192.9,24.1 L194.1,25.2 L195.0,24.5 L193.1,23.6 L200.1,24.1 L197.6,22.9 L205.4,21.3 L209.2,22.2 L204.6,22.7 L211.3,23.2 L208.7,24.1 L218.4,23.7 L223.2,25.9 L220.1,25.8 L222.5,26.8 L207.8,30.4 L202.9,32.2 L215.6,30.4 L212.8,30.2 L214.0,29.7 L219.7,29.9 L220.5,30.7 L220.1,32.1 L219.3,32.3 L219.3,32.6 L219.9,32.8 L221.1,32.9 L219.4,32.4 L220.3,32.1 L220.5,31.5 L221.5,31.3 L220.5,31.0 L230.5,30.9 L232.6,32.3 L238.4,32.7 L237.7,32.4 L242.4,30.6 L251.7,32.4 L249.4,32.6 L249.0,32.9 L251.0,33.2 L249.6,33.0 L248.4,33.1 L251.1,34.3 L247.8,33.6 L253.2,37.3 L257.3,34.7 L260.5,36.2 L270.9,35.7 L269.9,34.6 L271.7,34.1 L269.7,34.0 L273.7,33.2 L273.2,32.6 L284.5,33.7 L282.4,34.7 L283.3,34.1 L282.0,33.9 L280.2,35.1 L282.4,34.8 L285.0,33.6 L289.4,33.9 L290.0,34.5 L287.6,35.0 L293.9,36.8 L306.2,36.3 L307.4,37.4 L306.5,38.6 L308.6,38.9 L308.2,39.9 L309.0,40.2 L307.6,41.2 L309.2,40.3 L309.8,39.0 L314.2,38.3 L320.9,38.0 L325.3,40.0 L326.4,39.3 L325.0,38.2 L325.9,37.8 L325.9,37.0 L335.7,37.1 L341.9,38.7 L339.8,46.9 L337.1,48.1 L334.5,47.2 L333.3,47.3 L335.0,47.7 L332.8,47.5 L329.9,48.3 L335.3,47.8 L337.9,52.1 L333.5,51.9 L320.3,58.6 L318.7,57.2 L313.0,59.1 L313.5,57.7 L310.4,59.3 L308.4,58.9 L304.5,63.1 L306.8,63.8 L305.5,65.8 L306.3,65.8 L306.3,66.9 L304.7,66.6 L303.2,68.3 L303.6,70.0 L299.5,71.3 L299.2,73.5 L296.2,73.8 L295.6,76.0 L292.2,78.3 L291.6,69.3 L294.8,64.1 L297.8,63.6 L305.4,58.2 L308.9,57.1 L310.3,54.2 L313.1,53.7 L309.1,53.6 L308.5,55.5 L302.3,58.0 L303.0,57.0 L301.9,56.6 L303.2,55.1 L297.0,55.9 L291.0,59.8 L292.5,61.2 L285.2,62.1 L287.1,61.3 L281.9,60.2 L280.8,61.4 L269.9,61.3 L252.7,70.8 L255.7,71.3 L255.3,73.1 L256.0,72.3 L257.3,71.9 L256.3,73.6 L261.3,71.9 L264.1,73.9 L262.7,74.4 L264.0,76.3 L262.0,78.1 L260.2,83.9 L249.2,94.1 L245.1,95.7 L242.5,94.5 L238.2,97.6 L237.9,99.5 L233.4,101.7 L233.0,102.8 L236.9,107.0 L235.9,111.0 L235.1,110.7 L233.3,111.2 L232.5,112.2 L232.3,111.6 L231.4,112.0 L230.8,112.5 L231.2,111.5 L230.3,110.9 L231.7,109.0 L230.9,107.7 L230.2,107.6 L231.0,107.1 L231.7,107.7 L232.1,107.2 L231.5,105.5 L227.4,104.9 L229.5,103.9 L228.4,103.6 L229.1,102.0 L227.0,101.0 L224.7,101.5 L220.3,103.7 L222.9,100.2 L220.7,99.3 L215.8,102.9 L213.3,102.9 L213.2,104.3 L215.7,104.9 L216.0,106.8 L219.4,105.5 L223.3,106.3 L217.9,108.7 L215.9,111.1 L221.4,117.6 L216.7,116.3 L216.6,116.6 L217.5,117.1 L219.0,117.1 L221.5,119.2 L219.1,120.4 L218.9,120.2 L218.4,120.2 L218.3,120.2 L218.2,120.4 L218.0,120.4 L217.8,120.6 L220.3,120.3 L221.0,121.0 L221.4,121.2 L221.8,121.2 L220.4,122.0 L221.4,121.7 L221.6,122.4 L219.8,123.2 L220.8,124.3 L219.9,124.1 L219.5,124.9 L218.7,124.6 L217.9,127.5 L216.7,127.2 L217.5,128.0 L215.8,128.4 L216.1,128.8 L216.3,128.8 L217.1,128.7 L217.0,130.0 L216.3,129.5 L215.0,131.5 L214.0,131.2 L213.3,131.7 L214.0,132.1 L210.7,133.7 L210.7,134.6 L205.4,135.5 L205.1,134.2 L204.3,134.2 L203.9,134.6 L204.5,136.1 L203.8,135.2 L203.4,136.6 L198.0,137.4 L197.7,138.5 L198.6,139.2 L198.1,139.6 L196.3,136.7 L195.5,137.4 L194.0,136.3 L190.2,138.0 L188.3,141.9 L196.4,149.1 L198.2,154.0 L197.6,154.0 L197.7,156.4 L194.2,158.2 L193.5,157.6 L193.0,157.6 L192.4,158.3 L193.0,158.9 L192.6,158.7 L192.3,158.4 L192.2,158.4 L192.6,158.8 L193.2,159.1 L193.1,159.2 L193.0,159.2 L191.9,158.4 L191.8,158.4 L193.0,159.6 L191.2,158.8 L192.3,160.0 L189.6,161.5 L189.5,158.7 L186.8,157.5 L186.3,157.8 L186.0,156.6 L185.1,157.1 L184.7,155.5 L182.8,154.2 L179.6,153.7 L179.7,152.1 L177.5,152.4 L177.2,159.9 L178.5,159.9 L180.6,163.9 L187.5,167.6 L191.6,174.7 L190.8,174.2 L191.0,174.5 L190.3,174.5 L190.0,174.8 L184.3,171.9 L184.4,171.6 L184.1,171.1 L182.1,169.1 L182.1,168.5 L180.1,165.0 L176.2,161.6 L175.4,161.8 L175.6,155.4 L171.8,146.2 L169.7,144.4 L169.5,146.1 L168.3,145.7 L166.9,147.6 L166.7,146.8 L165.6,147.5 L165.8,146.6 L165.0,147.2 L165.2,146.8 L165.2,146.1 L164.3,147.1 L164.8,144.1 L163.2,140.6 L163.0,141.6 L161.9,140.6 L162.6,140.8 L162.9,140.7 L163.0,140.6 L163.0,140.4 L162.4,140.1 L162.6,140.0 L162.6,139.9 L162.1,139.9 L162.4,139.5 L161.0,139.1 L161.1,139.6 L160.9,138.3 L160.5,139.1 L160.2,138.9 L158.1,134.6 L157.1,133.6 L155.9,134.2 L155.1,132.2 L154.3,132.5 L154.7,132.7 L155.1,132.9 L154.8,133.3 L154.8,133.4 L154.9,133.5 L155.0,133.6 L154.9,133.6 L154.7,133.8 L155.2,134.6 L154.8,134.7 L154.4,135.7 L153.9,134.3 L153.0,135.8 L153.1,134.6 L152.6,135.8 L151.8,134.9 L151.1,136.0 L151.2,134.9 L150.9,134.8 L150.1,136.0 L149.9,134.8 L149.2,134.3 L146.2,138.9 L143.7,139.2 L137.6,145.1 L133.2,146.6 L133.6,156.7 L131.7,158.2 L132.7,158.5 L133.0,158.8 L130.6,158.8 L128.9,160.7 L126.5,159.1 L117.1,144.3 L114.8,134.9 L116.1,134.3 L114.6,133.8 L115.6,133.3 L114.4,133.0 L113.8,133.2 L113.8,135.2 L110.7,136.0 L106.5,132.8 L109.3,132.4 L110.0,131.4 L107.9,131.9 L105.2,130.5 L106.1,129.7 L105.0,130.2 L104.6,130.1 L105.9,128.8 L111.3,128.9 L107.7,123.4 L109.6,121.8 L113.1,122.1 L121.3,113.9 L118.3,112.0 L118.3,109.0 L122.5,109.5 L127.2,107.8 L123.6,107.0 L121.4,104.5 L113.4,105.2 L111.8,109.9 L109.1,109.8 L109.9,111.3 L108.1,111.8 L107.5,113.9 L101.5,115.1 L100.2,117.7 L95.3,118.3 L87.9,117.0 L93.4,122.7 L90.0,124.3 L89.0,126.5 L79.5,124.5 L78.3,121.8 L76.7,121.6 L73.5,122.8 L71.0,122.2 L65.6,119.4 L62.7,114.7 L57.6,114.6 L57.0,116.0 L59.5,119.7 L62.6,121.7 L64.0,125.6 L64.5,123.2 L65.9,123.4 L65.2,126.5 L66.7,127.3 L71.9,127.3 L72.6,127.0 L75.3,124.7 L76.2,124.3 L76.8,123.4 L77.5,123.3 L78.3,127.5 L85.4,131.3 L80.9,135.3 L80.9,137.8 L75.4,139.6 L74.5,141.2 L69.7,141.6 Z M12.5,87.2 L14.8,89.1 L11.1,88.9 L7.4,90.6 L9.3,89.6 L7.4,89.3 L8.5,87.1 L12.5,87.2 Z M28.8,79.7 L32.0,81.7 L32.9,81.4 L34.8,81.8 L27.4,83.2 L27.2,81.7 L24.8,80.9 L28.8,79.7 Z M81.2,33.8 L78.7,34.5 L76.4,34.0 L78.5,32.8 L81.2,33.8 Z M89.1,29.4 L89.1,30.3 L87.6,29.4 L88.8,29.3 L89.1,29.4 Z M90.7,10.0 L93.0,9.9 L94.0,10.3 L90.7,10.0 Z M95.8,9.7 L98.5,9.6 L99.6,10.0 L95.8,9.7 Z M95.3,8.6 L87.0,9.4 L83.2,8.6 L95.3,8.6 Z M88.5,8.2 L79.5,7.6 L85.9,7.6 L88.5,8.2 Z M75.8,122.0 L76.3,122.5 L74.7,122.7 L75.8,122.0 Z M123.9,42.0 L123.2,42.5 L121.9,41.7 L123.9,42.0 Z M104.7,34.2 L101.7,33.7 L100.7,32.7 L102.3,32.3 L104.7,34.2 Z M86.2,28.8 L91.7,25.5 L98.8,25.9 L95.1,27.4 L94.9,28.6 L99.3,31.6 L90.0,30.7 L92.0,30.2 L90.4,29.1 L86.2,28.8 Z M132.6,28.5 L129.1,28.2 L128.5,28.3 L131.3,27.4 L131.1,27.9 L131.8,28.0 L132.2,27.8 L132.6,28.5 Z M101.3,22.8 L98.8,21.8 L111.9,19.9 L129.9,20.1 L103.9,23.2 L104.8,24.1 L99.6,24.5 L101.8,25.2 L99.4,25.9 L92.9,24.3 L101.3,22.8 Z M103.6,10.6 L106.8,10.3 L106.9,10.7 L103.6,10.6 Z M108.7,11.0 L106.7,10.0 L111.8,10.7 L108.7,11.0 Z M118.4,10.5 L115.8,10.8 L112.0,10.0 L117.5,9.8 L118.4,10.5 Z M100.5,8.8 L103.0,8.8 L104.9,9.1 L102.4,9.1 L100.5,8.8 Z M101.6,8.4 L106.5,8.8 L108.8,9.4 L101.6,8.4 Z M121.0,9.8 L126.1,10.3 L119.5,10.1 L121.0,9.8 Z M108.5,9.2 L105.5,8.5 L110.2,9.2 L108.5,9.2 Z M118.0,9.3 L116.2,9.6 L114.1,9.3 L115.5,9.2 L118.0,9.3 Z M104.2,8.0 L107.2,7.9 L109.7,8.3 L106.3,8.4 L104.2,8.0 Z M107.3,7.8 L109.7,7.7 L111.3,8.2 L107.3,7.8 Z M110.1,7.4 L110.8,7.2 L113.7,7.4 L110.1,7.4 Z M139.2,163.6 L135.5,164.5 L134.7,163.2 L133.9,160.6 L134.2,161.0 L134.2,158.1 L135.5,158.4 L134.0,157.6 L134.6,157.6 L135.9,158.6 L137.6,160.2 L139.2,163.6 Z M145.2,30.8 L143.1,30.7 L146.6,30.5 L145.2,30.8 Z M147.9,30.0 L148.8,29.3 L149.4,30.1 L147.9,30.0 Z M139.6,28.9 L138.8,29.3 L137.7,28.8 L138.6,28.7 L139.4,28.8 L139.6,28.9 Z M157.3,24.3 L156.6,25.0 L155.7,24.6 L157.3,24.3 Z M181.1,178.7 L181.2,179.9 L180.5,178.7 L181.1,178.7 Z M176.6,174.2 L177.5,175.9 L175.7,174.3 L176.6,174.2 Z M173.8,172.3 L172.3,172.0 L172.1,171.4 L173.8,172.3 Z M162.1,151.5 L162.4,153.5 L162.1,155.4 L161.5,154.7 L162.1,151.5 Z M188.4,24.0 L187.7,24.3 L185.5,24.0 L188.4,24.0 Z M197.6,18.3 L187.5,17.7 L183.5,16.4 L188.3,15.4 L198.6,16.5 L196.0,17.5 L197.6,18.3 Z M185.8,15.7 L180.0,15.6 L179.8,15.1 L185.8,15.7 Z M195.2,14.2 L185.7,15.5 L181.2,14.6 L190.6,13.0 L189.7,12.8 L191.2,12.8 L195.2,14.2 Z M196.7,179.9 L199.0,182.8 L195.3,180.7 L196.7,179.9 Z M184.1,173.7 L184.1,172.9 L185.2,174.0 L186.9,174.6 L187.2,175.2 L187.8,175.6 L189.4,176.2 L188.2,176.7 L191.0,176.6 L190.2,177.6 L190.6,178.4 L193.1,179.0 L194.8,181.0 L194.4,182.2 L194.9,181.3 L197.8,182.6 L198.9,187.8 L197.7,187.0 L196.1,187.1 L196.4,187.8 L190.2,184.3 L180.9,176.5 L179.3,173.8 L169.7,166.6 L175.0,167.3 L184.1,173.7 Z M208.5,19.5 L196.9,20.5 L195.4,20.3 L202.9,17.4 L204.5,17.7 L202.5,18.7 L205.3,18.1 L208.5,19.5 Z M230.0,193.0 L228.3,192.8 L227.9,193.3 L226.4,193.6 L224.9,193.4 L225.5,192.4 L228.0,192.9 L226.8,191.9 L230.0,193.0 Z M223.6,192.1 L224.2,193.4 L222.8,193.1 L223.6,192.1 Z M221.3,191.9 L221.3,193.2 L219.4,191.9 L221.3,191.9 Z M216.9,192.2 L198.4,189.4 L199.6,187.8 L206.6,189.6 L209.8,189.8 L210.8,188.9 L214.5,189.7 L215.3,190.9 L216.3,191.2 L219.0,191.3 L219.5,192.6 L220.2,193.0 L216.9,192.2 Z M217.9,189.8 L216.8,190.4 L214.9,190.0 L217.9,189.8 Z M202.4,182.1 L201.4,183.1 L201.1,181.9 L202.4,182.1 Z M218.5,169.9 L219.6,170.7 L218.8,170.5 L219.0,170.9 L218.1,170.8 L218.0,170.9 L220.8,173.2 L220.3,173.7 L223.5,175.7 L221.1,175.4 L221.6,178.8 L219.2,180.6 L220.2,181.4 L219.7,183.9 L217.3,184.9 L216.0,183.2 L213.0,182.6 L210.9,183.8 L210.1,182.3 L207.0,182.7 L205.6,179.8 L202.2,176.7 L202.3,173.8 L202.9,173.5 L203.7,174.2 L204.5,174.1 L205.5,174.7 L205.6,174.5 L206.5,174.9 L206.7,174.8 L206.9,174.9 L207.0,174.9 L206.5,172.4 L209.6,171.6 L211.0,169.0 L213.8,168.5 L215.8,164.6 L216.1,165.4 L216.7,164.6 L217.1,165.3 L218.1,165.6 L217.8,166.7 L221.9,167.7 L219.7,168.5 L220.8,169.5 L218.9,169.4 L218.5,169.9 Z M220.4,158.4 L218.9,159.2 L216.2,162.2 L219.9,156.4 L220.4,158.4 Z M199.4,141.0 L197.3,143.5 L195.0,142.9 L196.1,140.2 L198.9,139.8 L199.4,141.0 Z M221.1,28.9 L219.6,29.7 L217.1,29.1 L221.1,28.9 Z M234.2,195.7 L233.2,195.6 L230.1,194.4 L232.1,194.0 L234.2,195.7 Z M237.7,192.5 L235.4,193.3 L231.3,193.0 L232.3,192.1 L236.6,192.8 L237.4,191.8 L237.7,192.5 Z M225.2,182.4 L225.4,177.4 L225.9,177.6 L225.9,176.1 L226.9,176.0 L227.2,175.0 L234.0,175.9 L236.2,174.4 L235.1,176.7 L226.4,177.0 L228.4,179.9 L230.1,178.9 L233.9,178.8 L230.0,180.7 L233.3,183.1 L233.0,183.9 L235.0,185.3 L232.3,185.9 L230.1,182.4 L229.0,182.3 L230.6,187.5 L229.1,187.7 L227.2,183.7 L226.0,183.8 L225.2,182.4 Z M222.8,152.7 L223.0,154.9 L220.9,152.6 L222.8,152.7 Z M223.5,143.1 L224.5,145.8 L222.6,149.1 L223.7,151.3 L224.8,151.8 L225.6,151.0 L228.4,152.0 L227.6,152.4 L228.2,153.4 L229.1,153.4 L229.0,154.4 L225.4,151.7 L225.8,153.2 L223.7,151.7 L221.5,152.0 L221.8,150.4 L220.0,150.1 L218.9,147.5 L219.2,147.1 L219.2,147.4 L219.7,147.8 L220.3,147.7 L220.1,143.1 L223.5,143.1 Z M221.7,131.4 L220.9,134.3 L219.7,136.6 L218.3,133.1 L220.8,130.2 L221.7,131.4 Z M240.4,195.9 L242.8,192.8 L247.0,192.4 L240.4,195.9 Z M239.8,192.1 L239.3,192.7 L238.5,192.6 L238.7,192.2 L239.8,192.1 Z M235.9,187.1 L235.0,187.3 L235.3,186.8 L235.0,185.4 L235.3,185.3 L235.9,187.1 Z M235.1,186.3 L234.3,187.0 L234.7,185.7 L235.1,186.3 Z M238.4,180.5 L236.7,181.0 L236.4,180.7 L238.4,180.5 Z M234.4,180.0 L233.2,180.3 L232.9,179.9 L233.6,179.5 L234.4,180.0 Z M234.7,160.4 L236.0,165.9 L234.8,164.0 L234.5,164.1 L234.6,167.2 L231.9,166.1 L230.1,163.1 L226.7,164.5 L229.1,161.5 L230.0,162.9 L233.4,160.9 L232.9,159.4 L234.7,160.4 Z M230.5,158.8 L230.1,159.8 L229.5,159.5 L230.5,158.8 Z M227.8,157.2 L228.2,159.8 L228.7,160.5 L228.2,160.9 L226.6,159.4 L227.8,157.2 Z M229.5,156.7 L229.7,158.4 L229.1,159.0 L228.7,160.2 L229.5,156.7 Z M231.4,156.5 L231.4,158.8 L229.9,156.2 L230.7,156.7 L231.4,156.5 Z M227.5,156.6 L226.9,157.6 L225.9,157.9 L225.4,158.3 L224.8,155.6 L227.5,156.6 Z M233.0,157.0 L231.4,156.7 L231.4,155.8 L229.5,154.3 L231.6,154.4 L233.0,157.0 Z M229.3,155.9 L227.4,155.5 L227.3,154.3 L228.8,155.0 L229.3,155.9 Z M243.7,191.1 L244.9,191.6 L243.5,191.7 L243.7,191.1 Z M243.1,184.1 L241.4,183.9 L240.8,183.1 L243.0,183.1 L243.1,184.1 Z M244.5,179.0 L241.1,175.2 L241.2,174.0 L241.9,173.4 L241.7,175.7 L243.6,174.5 L243.0,176.0 L244.7,176.9 L242.6,176.6 L244.5,179.0 Z M243.1,173.2 L242.2,173.2 L242.7,172.6 L243.1,173.2 Z M255.1,190.0 L255.2,191.6 L254.7,191.6 L255.1,190.0 Z M260.6,188.7 L260.0,189.4 L259.6,188.3 L260.2,188.6 L260.6,188.7 Z M261.0,188.5 L259.9,188.1 L259.9,186.9 L260.6,187.3 L261.0,188.5 Z M251.3,184.2 L245.2,182.9 L245.0,183.7 L244.6,183.1 L245.1,182.5 L247.9,182.3 L251.3,184.2 Z M248.9,180.3 L248.7,181.0 L247.7,180.7 L248.9,180.3 Z M250.0,177.9 L248.7,177.4 L249.3,178.0 L247.7,177.7 L248.9,177.3 L250.0,177.9 Z M242.0,115.2 L239.2,119.0 L239.4,117.6 L239.0,118.7 L238.1,118.2 L239.1,115.5 L238.3,114.7 L238.6,115.7 L237.3,115.9 L237.0,114.3 L239.2,113.2 L241.2,113.7 L242.0,115.2 Z M247.2,112.6 L243.9,115.6 L241.9,114.4 L245.8,112.3 L247.2,112.6 Z M270.9,191.0 L270.1,192.0 L268.5,192.1 L269.1,190.4 L270.9,191.0 Z M270.5,181.4 L275.9,193.2 L273.3,191.0 L271.1,191.8 L270.9,190.5 L269.8,189.9 L270.8,190.0 L270.9,189.8 L269.3,189.4 L270.7,189.5 L267.2,186.7 L257.8,184.1 L256.9,182.5 L255.7,184.6 L255.0,183.1 L252.9,182.3 L256.4,182.1 L256.6,181.0 L253.3,181.3 L252.2,180.0 L250.0,179.8 L252.3,177.9 L255.8,178.5 L257.3,181.5 L260.3,183.3 L264.2,179.7 L270.5,181.4 Z M262.5,180.3 L261.3,180.6 L259.3,180.1 L262.5,180.3 Z M261.0,179.1 L260.0,179.3 L258.6,178.3 L261.0,179.1 Z M246.9,111.5 L242.6,112.4 L242.3,112.6 L242.2,113.4 L242.0,113.5 L239.6,113.2 L244.1,109.9 L250.0,109.7 L251.6,106.3 L252.7,106.0 L252.4,106.5 L251.9,106.6 L251.7,106.9 L252.5,107.5 L255.1,106.3 L258.1,102.3 L258.0,99.8 L261.2,98.1 L262.1,102.0 L259.9,104.6 L258.5,110.6 L257.6,111.1 L257.3,111.0 L258.0,109.8 L257.3,109.7 L255.5,111.8 L255.4,110.7 L254.3,111.8 L251.9,111.8 L251.5,110.9 L250.9,111.7 L251.6,112.5 L249.4,114.1 L248.0,113.3 L248.7,111.7 L246.9,111.5 Z M269.0,94.3 L269.4,94.5 L268.6,94.6 L268.3,94.8 L266.1,95.2 L264.7,97.0 L259.4,95.8 L260.8,97.4 L258.8,98.2 L258.0,96.4 L259.4,94.3 L261.4,94.3 L262.9,89.8 L266.1,92.6 L267.0,92.6 L267.3,92.9 L267.4,92.9 L267.6,93.0 L268.0,93.0 L269.2,92.1 L268.6,93.3 L269.0,94.3 Z M271.4,92.0 L269.5,93.5 L269.3,93.4 L270.7,91.7 L271.4,92.0 Z M276.2,89.7 L273.8,90.7 L272.2,91.8 L274.4,89.8 L276.2,89.7 Z M266.7,71.9 L267.7,74.8 L267.0,77.6 L269.1,83.4 L267.9,82.2 L266.4,81.9 L267.2,82.1 L265.8,82.5 L264.6,85.3 L266.3,88.1 L264.5,87.4 L263.2,89.1 L265.0,78.4 L264.2,76.0 L264.8,73.8 L266.9,73.1 L266.7,71.9 Z M291.1,78.5 L289.6,80.2 L289.3,80.0 L291.1,78.5 Z M257.4,70.1 L257.4,71.3 L256.5,71.0 L257.4,70.1 Z M311.5,69.6 L310.8,68.7 L310.3,68.6 L311.3,68.5 L311.5,69.6 Z M309.7,60.5 L307.4,62.2 L307.3,62.0 L309.7,60.5 Z M278.8,31.8 L271.8,31.5 L276.5,30.3 L278.8,31.8 Z M274.5,29.6 L273.4,30.4 L273.0,30.0 L274.5,29.6 Z M293.4,27.7 L288.6,28.3 L285.0,27.4 L285.9,26.6 L293.4,27.7 Z M283.9,26.8 L279.8,27.8 L278.4,27.2 L279.6,26.4 L278.3,26.4 L278.1,27.5 L280.3,28.1 L271.5,28.8 L267.7,27.3 L268.8,27.3 L269.2,26.0 L271.2,25.7 L271.5,25.5 L272.5,25.3 L274.8,26.6 L276.8,25.4 L283.9,26.8 Z M265.1,27.2 L265.9,26.2 L266.6,26.7 L266.1,27.2 L265.1,27.2 Z",
    "Ameryka Północna": "M40,50 L59,29 L92,33 L109,36 L125,33 L167,30 L189,27 L208,24 L223,56 L258,73 L274,98 L254,107 L245,107 L239,112 L231,116 L227,126 L226,132 L216,143 L217,159 L215,162 L213,153 L204,146 L200,146 L183,152 L181,163 L182,169 L185,177 L198,176 L204,170 L204,172 L202,183 L206,187 L211,193 L211,203 L224,206 L221,207 L209,204 L204,197 L199,192 L194,189 L192,186 L183,184 L169,177 L164,165 L154,149 L142,140 L130,124 L127,107 L126,94 L120,90 L111,78 L88,64 L53,73 Z M208,168 L220,167 L229,173 L226,177 L218,176 L208,172 Z M221,179 L227,179 L227,183 L221,183 Z",
    "Ameryka Południowa": "M81.6,100.8 L49.2,90.0 L30.9,71.4 L17.5,64.5 L16.3,60.7 L26.4,55.2 L26.2,53.5 L23.1,55.5 L18.4,53.6 L24.0,45.3 L31.7,44.1 L33.0,40.7 L34.3,40.0 L35.6,40.5 L35.9,40.5 L35.8,40.1 L36.6,40.0 L36.9,40.3 L37.3,40.3 L37.8,40.3 L41.7,36.3 L36.0,26.0 L39.9,23.8 L38.2,21.7 L42.2,23.8 L41.0,21.9 L48.0,18.9 L48.4,15.1 L67.1,7.9 L70.2,8.9 L66.2,11.0 L68.8,19.0 L71.8,17.9 L68.5,13.3 L76.9,10.4 L75.4,7.9 L85.4,12.6 L93.8,10.9 L99.5,12.1 L105.3,9.4 L102.8,9.8 L102.6,9.3 L112.6,7.0 L108.3,8.7 L108.3,10.2 L110.0,9.4 L111.9,11.1 L117.6,10.5 L115.3,14.3 L116.7,14.5 L117.6,13.9 L117.4,14.1 L117.5,14.3 L120.8,12.7 L125.6,13.7 L128.5,15.3 L128.5,18.9 L130.8,16.8 L134.7,20.5 L135.3,18.3 L145.9,15.5 L147.4,28.5 L152.9,26.7 L156.0,17.2 L160.0,24.3 L163.7,26.2 L160.2,32.5 L159.2,37.6 L156.7,39.4 L158.5,39.1 L162.5,34.7 L163.3,38.3 L167.8,35.8 L167.8,36.0 L167.8,36.1 L168.1,36.3 L168.0,39.1 L170.8,34.0 L170.3,32.8 L170.9,32.1 L170.7,31.7 L171.0,31.4 L170.9,30.3 L173.2,29.5 L173.2,28.6 L180.0,29.6 L180.9,27.8 L183.2,30.0 L183.0,34.2 L185.7,28.6 L189.2,28.3 L191.9,27.2 L194.6,24.3 L207.7,24.8 L211.5,34.2 L209.2,56.0 L207.4,57.0 L208.0,57.1 L207.6,59.2 L207.7,60.2 L208.3,60.8 L207.9,60.6 L207.8,60.8 L211.3,73.9 L209.6,90.8 L207.2,95.4 L199.6,98.5 L193.5,103.8 L188.1,109.1 L188.7,109.0 L187.7,110.5 L187.9,109.9 L187.1,109.9 L185.6,110.7 L186.9,120.1 L179.8,129.1 L174.4,133.3 L180.3,127.3 L177.2,126.6 L172.2,136.2 L165.7,141.4 L148.1,142.5 L145.2,140.9 L147.1,138.4 L146.4,137.2 L144.6,142.3 L151.3,144.5 L153.8,148.6 L145.6,153.1 L124.2,154.5 L123.9,159.6 L108.1,159.3 L108.4,162.3 L115.6,162.4 L116.2,164.0 L108.6,163.6 L112.2,164.5 L106.0,165.9 L104.3,168.8 L95.7,169.2 L91.0,170.9 L102.0,174.0 L97.8,175.2 L101.6,175.6 L89.9,177.3 L87.3,179.3 L82.0,178.3 L80.1,178.8 L84.3,179.4 L76.9,180.9 L79.5,182.1 L76.8,181.9 L75.2,181.9 L82.9,184.1 L77.3,183.3 L66.2,183.4 L62.5,185.5 L54.9,183.6 L59.2,184.4 L64.3,183.6 L62.6,183.0 L54.4,182.9 L56.9,183.4 L53.6,183.3 L55.4,184.0 L49.2,182.4 L53.1,183.2 L51.8,182.1 L55.5,182.5 L61.5,182.6 L52.8,181.5 L54.0,181.9 L51.5,182.1 L51.5,182.5 L48.3,182.0 L52.6,181.5 L46.8,181.2 L48.4,180.9 L47.1,179.8 L55.1,181.6 L56.0,180.3 L54.6,179.8 L52.0,179.1 L55.4,180.2 L50.6,179.3 L52.9,180.1 L49.8,179.3 L50.1,180.5 L48.3,180.0 L48.1,178.0 L44.3,177.2 L47.4,177.6 L49.5,176.6 L45.9,177.1 L46.4,176.2 L41.8,175.3 L47.6,176.2 L44.8,174.4 L49.1,175.1 L48.6,173.6 L44.3,173.8 L48.7,172.2 L46.1,171.8 L45.9,171.5 L44.6,171.1 L45.0,171.0 L43.9,170.8 L53.5,171.8 L50.5,170.5 L48.9,171.0 L43.4,170.1 L48.2,170.4 L45.0,169.7 L48.9,169.7 L49.3,169.3 L48.2,168.7 L42.9,167.3 L37.2,167.3 L44.1,166.9 L45.3,166.2 L51.0,168.4 L53.3,166.2 L57.9,166.6 L54.3,165.3 L56.2,165.4 L59.0,165.2 L60.0,164.8 L55.6,163.5 L58.9,163.1 L59.6,159.7 L62.3,160.3 L62.3,159.2 L59.5,158.8 L63.5,158.6 L63.7,158.0 L55.5,158.2 L53.0,156.3 L58.7,153.0 L56.7,148.0 L59.9,147.8 L67.2,143.4 L72.9,137.8 L73.5,128.6 L83.5,109.3 L81.6,100.8 Z M41.1,175.1 L36.3,175.0 L37.0,174.4 L41.1,175.1 Z M38.2,173.7 L37.1,172.8 L41.0,173.4 L41.8,172.6 L40.3,172.2 L44.0,172.3 L43.5,175.0 L40.5,174.6 L42.8,173.6 L38.2,173.7 Z M50.5,183.0 L42.2,181.5 L39.4,180.4 L50.5,183.0 Z M49.0,160.6 L51.8,157.9 L55.5,158.3 L53.0,159.6 L53.0,159.8 L55.0,160.5 L53.5,160.4 L54.8,161.1 L49.0,160.6 Z M82.6,191.3 L77.4,190.4 L78.1,189.8 L70.0,188.9 L73.0,189.2 L73.4,189.0 L80.7,189.5 L76.5,189.3 L81.9,190.3 L80.0,190.2 L79.0,190.0 L78.4,190.0 L82.6,191.3 Z M88.0,190.9 L81.2,189.5 L89.5,190.6 L88.0,190.9 Z M68.3,188.2 L66.5,188.7 L63.5,187.9 L68.3,188.2 Z M101.8,190.5 L65.4,187.8 L67.6,187.6 L63.5,187.5 L64.2,187.2 L57.4,186.5 L57.2,186.1 L77.4,188.2 L70.0,186.1 L75.8,185.7 L68.4,184.9 L75.9,183.7 L88.6,188.3 L101.8,190.5 Z M58.5,186.0 L55.8,184.8 L60.0,185.3 L58.5,186.0 Z M56.8,184.7 L48.5,184.1 L46.7,183.1 L56.8,184.7 Z M55.2,165.3 L57.4,164.2 L59.1,164.7 L55.2,165.3 Z M109.5,191.3 L104.9,191.3 L104.1,191.1 L105.5,190.9 L109.5,191.3 Z M169.7,29.1 L166.6,36.5 L163.0,36.5 L163.4,31.3 L169.7,29.1 Z M165.6,28.6 L164.4,30.7 L163.1,30.6 L163.0,30.2 L165.6,28.6 Z",
    "Afryka": "M75.7,104.8 L56.5,94.2 L57.1,92.5 L50.7,85.8 L47.6,85.1 L48.4,82.4 L45.5,83.4 L44.8,81.4 L42.4,81.4 L46.1,80.7 L46.7,79.7 L42.5,80.9 L42.2,77.8 L43.2,78.7 L43.9,77.9 L46.5,77.7 L46.6,77.6 L46.6,77.5 L45.7,77.4 L43.8,77.8 L43.4,78.2 L42.7,78.2 L42.8,75.5 L41.6,76.7 L38.6,73.9 L41.2,70.3 L41.6,62.9 L39.7,55.4 L38.7,54.0 L36.8,52.5 L36.4,53.4 L36.5,51.9 L50.0,51.2 L48.7,46.3 L52.4,44.0 L51.2,35.7 L63.2,35.4 L62.6,29.9 L62.4,31.7 L53.1,32.7 L51.1,35.7 L50.3,39.6 L45.7,43.6 L43.9,50.9 L36.3,51.6 L42.5,35.3 L47.0,29.4 L56.2,24.7 L58.6,13.9 L67.4,9.1 L70.4,3.4 L86.0,5.9 L97.6,1.7 L133.1,0.2 L138.9,2.0 L136.1,3.9 L138.8,7.0 L133.9,10.1 L135.2,11.6 L155.0,16.4 L157.2,19.5 L170.3,23.4 L174.9,22.0 L175.4,18.0 L182.6,16.1 L213.2,24.1 L222.6,22.4 L226.7,24.3 L227.3,23.7 L229.4,24.5 L233.5,24.6 L236.1,24.2 L238.0,29.6 L234.3,34.3 L228.2,27.4 L226.9,28.5 L236.3,43.6 L238.8,45.4 L237.8,48.0 L242.4,50.7 L242.8,59.6 L247.2,62.0 L250.1,70.3 L251.1,69.3 L255.9,71.9 L263.5,78.0 L259.5,80.3 L262.5,80.6 L259.5,82.9 L261.8,86.2 L279.7,90.6 L284.8,87.0 L286.2,82.4 L296.7,81.4 L294.3,84.9 L296.0,85.0 L276.9,99.7 L244.9,115.9 L237.2,123.1 L235.0,126.7 L237.4,129.2 L235.9,131.4 L236.5,137.2 L239.6,138.8 L238.4,149.4 L237.6,149.6 L237.1,151.2 L234.0,153.5 L234.0,153.7 L234.1,153.8 L214.8,163.1 L217.4,169.6 L216.5,174.8 L206.5,180.4 L207.9,180.7 L205.6,187.2 L191.4,200.9 L185.0,204.5 L176.1,205.8 L168.9,209.4 L164.2,208.4 L162.7,205.0 L163.6,201.8 L154.1,189.1 L151.8,177.7 L143.2,166.0 L142.5,159.4 L148.4,144.7 L142.9,131.0 L145.8,130.0 L144.8,130.0 L143.3,130.7 L130.4,115.6 L131.5,116.4 L132.5,112.6 L133.0,113.4 L134.8,113.0 L132.3,112.1 L134.1,110.4 L132.4,110.2 L133.4,101.3 L131.6,101.9 L127.9,99.0 L128.3,100.3 L124.2,99.9 L123.6,101.0 L123.2,99.8 L122.9,99.7 L123.5,101.1 L120.4,101.4 L117.9,96.7 L117.1,97.2 L111.3,95.5 L112.9,94.9 L112.6,94.9 L94.0,101.9 L87.8,100.5 L75.7,104.8 Z M248.5,162.2 L247.9,156.1 L250.4,152.6 L257.8,151.8 L262.1,148.4 L261.8,149.5 L264.1,148.6 L264.5,145.7 L267.8,145.1 L270.6,141.5 L272.8,150.2 L271.2,151.5 L269.6,150.5 L269.5,153.6 L255.0,174.1 L249.1,176.0 L244.5,174.9 L243.1,168.1 L248.5,162.2 Z M237.8,127.6 L236.4,127.0 L237.2,125.8 L237.8,127.6 Z",
    "Australia i Oceania": "M93.4,163.4 L79.8,165.6 L72.6,170.3 L62.4,170.4 L56.7,173.8 L48.8,171.9 L48.5,169.6 L49.5,169.9 L50.4,168.9 L50.5,164.8 L44.1,149.5 L45.9,150.5 L44.8,148.3 L45.1,147.7 L46.9,149.9 L45.0,144.6 L47.0,137.7 L47.9,139.2 L54.8,133.5 L66.9,130.4 L72.8,121.4 L74.3,124.7 L74.7,120.6 L75.4,121.3 L75.6,120.7 L76.5,121.2 L76.9,121.1 L77.2,121.2 L78.2,121.3 L78.4,121.2 L77.2,118.7 L79.5,118.6 L78.6,117.6 L80.3,117.5 L79.6,116.4 L81.1,114.9 L81.8,116.1 L82.6,113.9 L86.4,113.9 L88.5,116.1 L88.1,116.5 L87.6,118.4 L88.4,118.1 L88.3,117.1 L89.0,117.0 L89.3,116.2 L92.7,117.4 L93.6,116.0 L91.9,114.9 L96.1,109.2 L102.7,108.3 L102.7,106.9 L102.2,106.4 L101.0,106.6 L100.0,106.0 L100.8,105.4 L101.2,106.2 L101.8,105.4 L102.7,106.5 L105.1,107.5 L110.1,108.6 L112.4,107.0 L112.6,109.0 L113.4,108.9 L113.1,108.2 L114.0,107.5 L114.4,107.3 L115.6,108.6 L111.9,111.5 L110.1,116.3 L113.8,119.0 L120.8,121.6 L121.6,122.9 L125.5,123.6 L128.8,119.0 L131.4,109.3 L130.1,108.8 L133.7,103.3 L136.8,114.0 L139.1,113.3 L141.8,115.5 L141.7,119.8 L144.5,127.0 L152.8,130.4 L155.7,136.8 L159.3,136.3 L159.8,139.6 L162.4,141.2 L163.2,140.9 L167.7,146.3 L168.4,146.2 L167.9,149.7 L170.3,153.8 L168.6,160.5 L162.6,167.4 L159.3,178.3 L151.5,179.8 L146.4,181.8 L147.1,183.0 L143.6,180.6 L142.9,180.6 L141.9,181.4 L140.9,180.9 L141.6,179.6 L137.1,182.4 L129.8,181.3 L124.0,178.3 L120.7,173.8 L123.4,175.5 L122.1,173.2 L118.1,174.0 L119.3,171.7 L117.7,169.9 L116.8,172.7 L113.8,173.1 L115.8,172.1 L117.1,168.5 L116.4,165.6 L111.0,172.5 L108.1,171.4 L108.5,169.8 L103.2,164.7 L93.4,163.4 Z M114.9,114.1 L113.0,114.1 L113.4,112.9 L114.4,112.4 L114.4,113.0 L114.6,113.0 L114.9,112.7 L114.9,114.1 Z M96.5,107.4 L94.7,107.5 L95.6,106.2 L96.0,107.2 L96.5,107.4 Z M98.6,105.7 L97.4,107.8 L96.0,105.7 L98.6,105.7 Z M153.9,193.6 L151.7,192.6 L150.8,194.9 L147.5,194.8 L141.8,187.2 L143.3,187.6 L143.8,187.3 L148.5,188.4 L154.2,187.4 L153.9,193.6 Z M117.8,174.8 L116.0,175.3 L113.0,174.9 L116.5,173.9 L117.8,174.8 Z M132.7,79.5 L142.7,82.8 L146.4,85.8 L146.0,87.7 L151.6,89.1 L152.5,91.1 L149.5,91.3 L150.0,93.4 L160.8,102.3 L150.9,101.2 L146.2,95.4 L141.2,93.8 L138.4,93.7 L139.2,95.2 L137.3,95.0 L138.0,96.0 L135.0,96.2 L134.3,96.4 L134.0,95.9 L133.5,96.0 L133.2,96.1 L137.1,97.6 L134.5,99.3 L133.1,98.9 L129.2,98.8 L132.7,79.5 Z M163.1,100.4 L161.9,100.9 L161.3,99.7 L163.1,100.4 Z M168.5,85.0 L161.2,89.7 L154.4,88.1 L159.8,87.4 L160.7,85.9 L160.6,87.5 L163.2,87.2 L166.0,85.4 L165.8,83.3 L168.0,83.1 L168.5,85.0 Z M170.3,82.3 L170.2,85.2 L168.6,81.4 L163.8,79.1 L164.0,78.5 L170.3,82.3 Z M167.9,145.5 L167.6,144.2 L168.6,142.7 L168.9,143.6 L167.9,145.5 Z M186.5,95.1 L184.3,95.1 L185.1,94.1 L186.5,95.1 Z M192.2,93.9 L192.9,95.0 L190.5,94.1 L188.9,92.7 L192.2,93.9 Z M185.3,92.4 L183.8,92.0 L182.0,90.2 L184.0,90.9 L185.3,92.4 Z M180.1,90.5 L178.0,90.5 L176.3,86.7 L177.5,87.1 L180.1,90.5 Z M233.7,202.6 L231.9,202.8 L231.0,203.2 L231.7,201.7 L233.7,202.6 Z M222.3,117.6 L221.1,118.3 L220.1,116.4 L222.3,117.6 Z M219.7,113.6 L217.9,115.0 L217.9,112.8 L219.7,113.6 Z M202.2,102.1 L200.3,101.8 L198.6,100.3 L201.5,101.0 L202.2,102.1 Z M196.9,99.3 L193.3,99.2 L192.6,97.8 L196.9,99.3 Z M199.0,98.6 L197.2,97.2 L196.5,94.8 L199.0,98.6 Z M255.4,186.6 L251.5,193.2 L251.7,193.7 L244.8,195.0 L243.4,199.3 L239.2,201.2 L225.9,199.9 L232.4,194.6 L241.9,191.2 L246.0,185.9 L247.8,184.9 L248.8,184.8 L250.3,186.9 L253.8,185.8 L253.1,186.8 L253.8,185.9 L253.8,186.8 L254.9,186.7 L255.4,186.6 Z M265.8,180.9 L262.3,186.5 L256.6,186.8 L258.3,183.6 L252.0,181.5 L255.2,180.1 L255.8,175.4 L253.9,175.2 L253.7,173.1 L250.9,172.1 L251.9,173.6 L245.4,168.2 L252.5,170.3 L254.6,174.9 L258.7,175.8 L257.2,173.7 L258.0,173.7 L260.5,176.8 L265.4,177.7 L271.3,176.7 L269.4,181.0 L265.8,180.9 Z M266.0,121.7 L262.8,122.3 L260.2,121.2 L264.0,119.5 L266.0,121.7 Z M270.9,116.3 L269.3,117.8 L271.2,116.9 L270.8,117.5 L271.1,117.8 L265.2,118.0 L270.9,116.3 Z",
};

// ─── Map SVG generator ────────────────────────────────────────────────────────
function generateMapSVG(countryName, small = false) {
    const continent = COUNTRY_CONTINENT[countryName];
    if (!continent) return '?';
    const [cx, cy] = CENTROIDS_SVG[countryName] || [150, 110];
    const path = CONTINENT_PATHS[continent] || '';
    const W = 300, H = 220;
    const r = small ? 7 : 11;
    const maxH = small ? '130px' : '220px';
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:${maxH};display:block;margin:auto">
        <rect width="${W}" height="${H}" fill="#0f172a" rx="6"/>
        <path d="${path}" fill="#334155" stroke="#475569" stroke-width="${small ? 0.8 : 1.2}" stroke-linejoin="round"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 2.2}" fill="#38bdf8" opacity="0.18"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#38bdf8"/>
        <circle cx="${cx}" cy="${cy}" r="${r * 0.38}" fill="white"/>
    </svg>`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ATTR_LABELS = {
    panstwo:      "🗺️ Państwo",
    stolica:      "🏛️ Stolica",
    flaga:        "🏳️ Flaga",
    ludnosc:      "👥 Ludność",
    powierzchnia: "📐 Powierzchnia",
    mapa:         "📍 Mapa",
};

const INSTRUCTIONS = {
    "flaga|panstwo":      "Czyja to flaga? Wybierz państwo:",
    "flaga|stolica":      "Jaka jest stolica kraju z tą flagą?",
    "flaga|ludnosc":      "Jaka jest ludność kraju z tą flagą?",
    "flaga|powierzchnia": "Jaka jest powierzchnia kraju z tą flagą?",
    "flaga|mapa":         "Wskaż na mapie kraj z tą flagą:",
    "panstwo|flaga":      "Wybierz flagę tego państwa:",
    "panstwo|stolica":    "Jaka jest stolica tego państwa?",
    "panstwo|ludnosc":    "Jaka jest ludność tego państwa?",
    "panstwo|powierzchnia":"Jaka jest powierzchnia tego państwa?",
    "panstwo|mapa":       "Wskaż lokalizację tego państwa na mapie:",
    "stolica|flaga":      "Czyją flagę ma kraj z tą stolicą?",
    "stolica|panstwo":    "W którym państwie jest ta stolica?",
    "stolica|ludnosc":    "Jaka jest ludność kraju z tą stolicą?",
    "stolica|powierzchnia":"Jaka jest powierzchnia kraju z tą stolicą?",
    "stolica|mapa":       "Wskaż na mapie kraj z tą stolicą:",
    "ludnosc|flaga":      "Czyja flaga? (kraj z tą liczbą ludności)",
    "ludnosc|panstwo":    "Które państwo ma tę liczbę ludności?",
    "ludnosc|stolica":    "Jaka jest stolica kraju z tą liczbą ludności?",
    "ludnosc|powierzchnia":"Jaka jest powierzchnia kraju z tą liczbą ludności?",
    "ludnosc|mapa":       "Wskaż na mapie kraj z tą liczbą ludności:",
    "powierzchnia|flaga": "Czyja flaga? (kraj o tej powierzchni)",
    "powierzchnia|panstwo":"Które państwo ma tę powierzchnię?",
    "powierzchnia|stolica":"Jaka jest stolica kraju o tej powierzchni?",
    "powierzchnia|ludnosc":"Jaka jest ludność kraju o tej powierzchni?",
    "powierzchnia|mapa":  "Wskaż na mapie kraj o tej powierzchni:",
    "mapa|panstwo":       "Które państwo jest zaznaczone na mapie?",
    "mapa|stolica":       "Jaka jest stolica państwa zaznaczonego na mapie?",
    "mapa|flaga":         "Czyja flaga? (państwo zaznaczone na mapie)",
    "mapa|ludnosc":       "Jaka jest ludność państwa zaznaczonego na mapie?",
    "mapa|powierzchnia":  "Jaka jest powierzchnia państwa zaznaczonego na mapie?",
};

const ATTR_LABELS_EN = {
    panstwo:      "🗺️ Country",
    stolica:      "🏛️ Capital",
    flaga:        "🏳️ Flag",
    ludnosc:      "👥 Population",
    powierzchnia: "📐 Area",
    mapa:         "📍 Map",
};

const INSTRUCTIONS_EN = {
    "flaga|panstwo":       "Which country has this flag?",
    "flaga|stolica":       "What is the capital of this country?",
    "flaga|ludnosc":       "What is the population of this country?",
    "flaga|powierzchnia":  "What is the area of this country?",
    "flaga|mapa":          "Find this country on the map:",
    "panstwo|flaga":       "Choose this country's flag:",
    "panstwo|stolica":     "What is the capital of this country?",
    "panstwo|ludnosc":     "What is the population of this country?",
    "panstwo|powierzchnia":"What is the area of this country?",
    "panstwo|mapa":        "Find this country on the map:",
    "stolica|flaga":       "Which country has this capital?",
    "stolica|panstwo":     "Which country has this capital?",
    "stolica|ludnosc":     "What is the population of this country?",
    "stolica|powierzchnia":"What is the area of this country?",
    "stolica|mapa":        "Find this country on the map:",
    "ludnosc|flaga":       "Which flag? (country with this population)",
    "ludnosc|panstwo":     "Which country has this population?",
    "ludnosc|stolica":     "What is the capital of this country?",
    "ludnosc|powierzchnia":"What is the area of this country?",
    "ludnosc|mapa":        "Find this country on the map:",
    "powierzchnia|flaga":  "Which flag? (country with this area)",
    "powierzchnia|panstwo":"Which country has this area?",
    "powierzchnia|stolica":"What is the capital of this country?",
    "powierzchnia|ludnosc":"What is the population of this country?",
    "powierzchnia|mapa":   "Find this country on the map:",
    "mapa|panstwo":        "Which country is shown on the map?",
    "mapa|stolica":        "What is the capital of the highlighted country?",
    "mapa|flaga":          "Which flag? (highlighted country)",
    "mapa|ludnosc":        "What is the population of the highlighted country?",
    "mapa|powierzchnia":   "What is the area of the highlighted country?",
};

function getAttrVal(country, attr) {
    if (lang === 'en') {
        if (attr === 'panstwo') return country.panstwo_en || country.panstwo;
        if (attr === 'stolica') return country.stolica_en || country.stolica;
    }
    return country[attr];
}

const UI = {
    pl: {
        subtitle:     "Quiz geograficzny – sprawdź swoją wiedzę!",
        continent:    "Kontynent",
        attrTop:      "Atrybut wyświetlany NA GÓRZE",
        attrBottom:   "Atrybut do wyboru NA DOLE",
        numQ:         "Liczba pytań",
        startBtn:     "Rozpocznij Quiz →",
        errSame:      "⚠️ Atrybut na górze i na dole muszą być różne!",
        errFew:       "⚠️ Za mało krajów na tym kontynencie!",
        question:     "Pytanie",
        score:        "Punkty",
        correct1:     (pts) => `✅ Brawo! +${pts} punkt${pts===3?'y':''}`,
        correct2:     () => `✅ Poprawnie! +1 punkt`,
        wrong1:       "❌ Błąd! Spróbuj jeszcze raz…",
        reveal:       (ans) => `😔 Poprawna odpowiedź: ${ans}`,
        nextQ:        "Następne Pytanie →",
        seeResults:   "Zobacz Wyniki →",
        resTitle:     "🏆 Wyniki",
        resPts:       (max) => `na ${max} możliwych punktów`,
        comments:     ["🏆 Doskonale! Jesteś mistrzem geografii!","🌟 Świetnie! Znasz się na mapach!","📚 Nieźle! Jest jeszcze pole do nauki.","💪 Spróbuj jeszcze raz!","🌍 Warto więcej ćwiczyć!"],
        replay:       "Zagraj ponownie",
        continents:   { "Wszystkie":"🌐 Wszystkie","Europa":"🌍 Europa","Azja":"🌏 Azja","Ameryka Północna":"🌎 Ameryka Północna","Ameryka Południowa":"🌎 Ameryka Południowa","Afryka":"🌍 Afryka","Australia i Oceania":"🌏 Australia i Oceania" },
        attrOpts:     { flaga:"🏳️ Flaga",panstwo:"🗺️ Państwo",stolica:"🏛️ Stolica",ludnosc:"👥 Ludność",powierzchnia:"📐 Powierzchnia",mapa:"📍 Mapa" },
        defaultInstr: "Wybierz poprawną odpowiedź:",
    },
    en: {
        subtitle:     "Geography quiz – test your knowledge!",
        continent:    "Continent",
        attrTop:      "Attribute shown ON TOP",
        attrBottom:   "Attribute to choose AT BOTTOM",
        numQ:         "Number of questions",
        startBtn:     "Start Quiz →",
        errSame:      "⚠️ Top and bottom attributes must be different!",
        errFew:       "⚠️ Not enough countries on this continent!",
        question:     "Question",
        score:        "Score",
        correct1:     (pts) => `✅ Great! +${pts} point${pts===1?'':'s'}`,
        correct2:     () => `✅ Correct! +1 point`,
        wrong1:       "❌ Wrong! Try again…",
        reveal:       (ans) => `😔 Correct answer: ${ans}`,
        nextQ:        "Next Question →",
        seeResults:   "See Results →",
        resTitle:     "🏆 Results",
        resPts:       (max) => `out of ${max} possible points`,
        comments:     ["🏆 Excellent! You're a geography master!","🌟 Great! You know your maps!","📚 Not bad! Room to improve.","💪 Try again!","🌍 Keep practicing!"],
        replay:       "Play again",
        continents:   { "Wszystkie":"🌐 All","Europa":"🌍 Europe","Azja":"🌏 Asia","Ameryka Północna":"🌎 North America","Ameryka Południowa":"🌎 South America","Afryka":"🌍 Africa","Australia i Oceania":"🌏 Australia & Oceania" },
        attrOpts:     { flaga:"🏳️ Flag",panstwo:"🗺️ Country",stolica:"🏛️ Capital",ludnosc:"👥 Population",powierzchnia:"📐 Area",mapa:"📍 Map" },
        defaultInstr: "Choose the correct answer:",
    },
};

// ─── Language Button & UI Init ───────────────────────────────────────────────
(function() {
    const ui = UI[lang];
    const btnPl = document.getElementById('btn-lang-pl');
    const btnEn = document.getElementById('btn-lang-en');
    if (!btnPl || !btnEn) return;
    const activeStyle = { background: '#1e40af', border: '1px solid #3b82f6' };
    const inactiveStyle = { background: '#334155', border: '1px solid #475569' };
    if (lang === 'en') {
        Object.assign(btnEn.style, activeStyle);
        Object.assign(btnPl.style, inactiveStyle);
    } else {
        Object.assign(btnPl.style, activeStyle);
        Object.assign(btnEn.style, inactiveStyle);
    }
    btnPl.addEventListener('click', () => { localStorage.setItem('lang', 'pl'); location.reload(); });
    btnEn.addEventListener('click', () => { localStorage.setItem('lang', 'en'); location.reload(); });

    document.querySelector('.game-subtitle').textContent = ui.subtitle;
    document.querySelector('label[for="sel-continent"]').textContent = ui.continent;
    document.querySelector('label[for="sel-top"]').textContent = ui.attrTop;
    document.querySelector('label[for="sel-bottom"]').textContent = ui.attrBottom;
    document.querySelector('label[for="sel-questions"]').textContent = ui.numQ;
    document.getElementById('btn-start').textContent = ui.startBtn;
    document.getElementById('btn-replay').textContent = ui.replay;
    document.getElementById('score-label').textContent = ui.score;
    document.getElementById('result-title').textContent = ui.resTitle;

    document.getElementById('sel-continent').querySelectorAll('option').forEach(opt => {
        if (ui.continents[opt.value]) opt.textContent = ui.continents[opt.value];
    });
    ['sel-top', 'sel-bottom'].forEach(id => {
        document.getElementById(id).querySelectorAll('option').forEach(opt => {
            if (ui.attrOpts[opt.value]) opt.textContent = ui.attrOpts[opt.value];
        });
    });
})();

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getPool(continent) {
    if (continent === "Wszystkie") {
        return Object.values(COUNTRIES).flat();
    }
    return [...COUNTRIES[continent]];
}

// Minimum pixel distance (in the 300×220 SVG viewport) between map dots
// to ensure distractors are visually distinguishable from each other.
const MAP_MIN_PIXEL_DISTANCE = 40;

function getDistractors(correct, pool, attr, count = 3) {
    // Map mode needs continent-based selection + spatial distance enforcement
    if (attr === 'mapa') {
        return getMapDistractors(correct, count);
    }
    const correctVal = correct[attr];
    const candidates = pool.filter(c => c !== correct && c[attr] !== correctVal);
    shuffle(candidates);
    const used = new Set([correctVal]);
    const result = [];
    for (const c of candidates) {
        if (!used.has(c[attr])) {
            result.push(c[attr]);
            used.add(c[attr]);
            if (result.length === count) break;
        }
    }
    // fallback: allow duplicates if not enough unique distractors
    for (const c of candidates) {
        if (result.length >= count) break;
        if (!result.includes(c[attr])) result.push(c[attr]);
    }
    return result;
}

function getMapDistractors(correct, count = 3) {
    const correctName = correct.panstwo;
    const correctContinent = COUNTRY_CONTINENT[correctName];
    const correctCoords = CENTROIDS_SVG[correctName];

    // Use all countries from the same continent as candidate distractors
    const continentPool = (COUNTRIES[correctContinent] || [])
        .filter(c => c.panstwo !== correctName && CENTROIDS_SVG[c.panstwo]);
    shuffle(continentPool);

    const MIN_DIST = MAP_MIN_PIXEL_DISTANCE;
    const chosenCoords = correctCoords ? [correctCoords] : [];
    const result = [];

    // First pass: enforce minimum distance from all already-chosen countries
    for (const c of continentPool) {
        if (result.length >= count) break;
        const coords = CENTROIDS_SVG[c.panstwo];
        const farEnough = chosenCoords.every(([cx, cy]) => {
            const dx = coords[0] - cx, dy = coords[1] - cy;
            return Math.sqrt(dx * dx + dy * dy) >= MIN_DIST;
        });
        if (farEnough) {
            result.push(c.panstwo);
            chosenCoords.push(coords);
        }
    }

    // Fallback: fill remaining slots without distance constraint
    for (const c of continentPool) {
        if (result.length >= count) break;
        if (!result.includes(c.panstwo)) {
            result.push(c.panstwo);
        }
    }

    return result;
}

// ─── Game State ───────────────────────────────────────────────────────────────
let state = {};

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const screens = {
    setup:   document.getElementById('screen-setup'),
    game:    document.getElementById('screen-game'),
    results: document.getElementById('screen-results'),
};

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

// ─── Setup ────────────────────────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', () => {
    const continent  = document.getElementById('sel-continent').value;
    const topAttr    = document.getElementById('sel-top').value;
    const bottomAttr = document.getElementById('sel-bottom').value;
    const numQ       = parseInt(document.getElementById('sel-questions').value, 10);
    const errEl      = document.getElementById('setup-error');

    if (topAttr === bottomAttr) {
        errEl.textContent = UI[lang].errSame;
        return;
    }
    errEl.textContent = '';

    const pool = getPool(continent);
    if (pool.length < 4) {
        errEl.textContent = UI[lang].errFew;
        return;
    }

    const shuffled = shuffle([...pool]);
    const questions = shuffled.slice(0, Math.min(numQ, pool.length));

    state = {
        continent,
        topAttr,
        bottomAttr,
        numQ: questions.length,
        questions,
        pool,
        currentQ: 0,
        score: 0,
        attempts: 0,
        answered: false,
        results: [],        // { country, correct, pointsEarned }
    };

    document.getElementById('score-max').textContent = state.numQ * 3;

    showScreen('game');
    renderQuestion();
});

// ─── Render Question ──────────────────────────────────────────────────────────
function renderQuestion() {
    const { currentQ, questions, topAttr, bottomAttr, pool, score, numQ } = state;
    const country = questions[currentQ];

    // HUD
    const ui = UI[lang];
    document.getElementById('q-counter').textContent = `${ui.question} ${currentQ + 1} / ${numQ}`;
    document.getElementById('score-display').textContent = score;

    // Progress dots
    const progressBar = document.getElementById('progress-bar');
    if (progressBar.children.length !== numQ) {
        progressBar.innerHTML = '';
        for (let i = 0; i < numQ; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            progressBar.appendChild(dot);
        }
    }
    const dots = progressBar.querySelectorAll('.progress-dot');
    dots.forEach((d, i) => {
        d.classList.remove('done', 'current');
        if (i < currentQ)       d.classList.add('done');
        else if (i === currentQ) d.classList.add('current');
    });

    // Top card
    const topLabel = document.getElementById('top-attr-label');
    const topValue = document.getElementById('top-value');
    const attrLabels = lang === 'en' ? ATTR_LABELS_EN : ATTR_LABELS;
    topLabel.textContent = attrLabels[topAttr];

    const val = getAttrVal(country, topAttr);
    topValue.className = 'q-value';
    if (topAttr === 'mapa') {
        topValue.innerHTML = generateMapSVG(country.panstwo, false);
        topValue.classList.add('map-mode');
    } else {
        if (topAttr === 'panstwo') {
            const showFlag = bottomAttr !== 'flaga';
            topValue.textContent = showFlag ? country.flaga + '\u00A0' + val : val;
            topValue.classList.add('text-mode');
            if (val.length > 14) topValue.classList.add('small-text');
            if (showFlag) twemoji.parse(topValue, { folder: 'svg', ext: '.svg' });
        } else {
            topValue.textContent = val;
            if (topAttr !== 'flaga') {
                topValue.classList.add('text-mode');
                if (val.length > 14) topValue.classList.add('small-text');
            } else {
                twemoji.parse(topValue, { folder: 'svg', ext: '.svg' });
            }
        }
    }

    // Instruction
    const key = `${topAttr}|${bottomAttr}`;
    const instrMap = lang === 'en' ? INSTRUCTIONS_EN : INSTRUCTIONS;
    document.getElementById('q-instruction').textContent = instrMap[key] || UI[lang].defaultInstr;

    // Answers
    const correctVal = bottomAttr === 'mapa' ? country.panstwo : getAttrVal(country, bottomAttr);
    const distractorPool = (topAttr === 'mapa' && bottomAttr !== 'mapa')
        ? (COUNTRIES[COUNTRY_CONTINENT[country.panstwo]] || pool)
        : pool;
    const distractors = getDistractors(country, distractorPool, bottomAttr);
    const choices = shuffle([correctVal, ...distractors]);

    const grid = document.getElementById('answers-grid');
    grid.innerHTML = '';
    choices.forEach(choice => {
        const btn = document.createElement('button');
        if (bottomAttr === 'mapa') {
            btn.className = 'answer-btn map-btn';
            btn.innerHTML = generateMapSVG(choice, true);
        } else {
            btn.className = 'answer-btn' + (bottomAttr === 'flaga' ? ' emoji' : '');
            btn.textContent = choice;
            if (bottomAttr === 'flaga') {
                twemoji.parse(btn, { folder: 'svg', ext: '.svg' });
            }
        }
        btn.dataset.value = choice;
        btn.addEventListener('click', () => handleAnswer(choice, correctVal));
        grid.appendChild(btn);
    });

    // Reset state
    state.attempts = 0;
    state.answered = false;
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    const btnNext = document.getElementById('btn-next');
    btnNext.style.display = 'none';
    btnNext.textContent = currentQ === numQ - 1 ? UI[lang].seeResults : UI[lang].nextQ;

    // Pop animation
    const topCard = document.getElementById('top-card');
    topCard.classList.remove('pop');
    void topCard.offsetWidth;
    topCard.classList.add('pop');
}

// ─── Handle Answer ────────────────────────────────────────────────────────────
function handleAnswer(chosen, correct) {
    if (state.answered) return;

    const grid = document.getElementById('answers-grid');
    const btns = grid.querySelectorAll('.answer-btn');
    const feedEl = document.getElementById('feedback');

    state.attempts++;

    if (chosen === correct) {
        // Correct
        state.answered = true;
        const pts = state.attempts === 1 ? 3 : 1;
        state.score += pts;
        state.results.push({ country: state.questions[state.currentQ], correct, pointsEarned: pts });

        btns.forEach(b => {
            b.disabled = true;
            if (b.dataset.value === correct) b.classList.add('correct');
        });

        feedEl.className = 'feedback ok pop';
        feedEl.textContent = state.attempts === 1 ? UI[lang].correct1(pts) : UI[lang].correct2();
        document.getElementById('score-display').textContent = state.score;
        document.getElementById('btn-next').style.display = 'inline-block';

    } else {
        // Wrong
        btns.forEach(b => {
            if (b.dataset.value === chosen) b.classList.add('wrong');
        });

        if (state.attempts === 1) {
            // First wrong – allow retry
            btns.forEach(b => {
                if (b.dataset.value !== chosen) {
                    b.disabled = false;
                } else {
                    b.disabled = true;
                }
            });
            feedEl.className = 'feedback bad shake';
            feedEl.textContent = UI[lang].wrong1;
        } else {
            // Second wrong – reveal and end
            state.answered = true;
            state.results.push({ country: state.questions[state.currentQ], correct, pointsEarned: 0 });

            btns.forEach(b => {
                b.disabled = true;
                if (b.dataset.value === correct) b.classList.add('reveal');
            });
            feedEl.className = 'feedback info pop';
            feedEl.textContent = UI[lang].reveal(correct);
            document.getElementById('btn-next').style.display = 'inline-block';
        }
    }
}

// ─── Next Question ────────────────────────────────────────────────────────────
document.getElementById('btn-next').addEventListener('click', () => {
    state.currentQ++;
    if (state.currentQ >= state.numQ) {
        showResults();
    } else {
        renderQuestion();
    }
});

// ─── Results ─────────────────────────────────────────────────────────────────
function showResults() {
    const { score, results, topAttr, bottomAttr, numQ } = state;
    showScreen('results');

    document.getElementById('result-score').textContent = score;
    const maxPts = numQ * 3;
    document.getElementById('result-max').textContent = UI[lang].resPts(maxPts);

    const comments = UI[lang].comments;
    let comment = '';
    if (score >= maxPts * 0.87)      comment = comments[0];
    else if (score >= maxPts * 0.67) comment = comments[1];
    else if (score >= maxPts * 0.47) comment = comments[2];
    else if (score >= maxPts * 0.27) comment = comments[3];
    else                              comment = comments[4];
    document.getElementById('result-comment').textContent = comment;

    const list = document.getElementById('result-list');
    list.innerHTML = '';
    const attrLabels = lang === 'en' ? ATTR_LABELS_EN : ATTR_LABELS;
    results.forEach((r, i) => {
        const item = document.createElement('div');
        item.className = 'result-item';

        const topVal = topAttr === 'mapa' ? r.country.panstwo : r.country[topAttr];
        const label = `${i + 1}. ${attrLabels[topAttr]}: ${topVal}`;

        item.innerHTML = `
            <div class="result-item-left">${label}</div>
            <div class="result-item-ans">${r.correct}</div>
            <div class="result-item-pts ${r.pointsEarned === 3 ? 'pts-3' : r.pointsEarned === 1 ? 'pts-1' : 'pts-0'}">
                ${r.pointsEarned > 0 ? '+' + r.pointsEarned : '0'}
            </div>`;
        list.appendChild(item);
        twemoji.parse(item, { folder: 'svg', ext: '.svg' });
    });
}

// ─── Replay ───────────────────────────────────────────────────────────────────
document.getElementById('btn-replay').addEventListener('click', () => {
    showScreen('setup');
});
