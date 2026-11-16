import { Dua } from '../types';
import rawHisnAdhkar from './hisnulMuslimComplete.json';

export type DuaSectionId = 'DAILY' | 'AZKAR' | 'OCCASIONAL';

export type DuaIconKey =
  | 'moon'
  | 'toilet'
  | 'droplets'
  | 'mosque'
  | 'prayer'
  | 'home'
  | 'garment'
  | 'travel'
  | 'food'
  | 'sun'
  | 'remembrance'
  | 'after-prayers'
  | 'rizq'
  | 'knowledge'
  | 'faith'
  | 'judgement'
  | 'forgiveness'
  | 'praising'
  | 'protection'
  | 'family'
  | 'health'
  | 'loss'
  | 'sorrow-joy'
  | 'patience'
  | 'debt'
  | 'menstruation'
  | 'deceased'
  | 'hajj'
  | 'ramadan'
  | 'nature'
  | 'etiquette'
  | 'guidance';

export interface LibraryDuaEntry extends Dua {
  verificationLevel: 'quran' | 'sunnah' | 'hasan' | 'guidance';
  verificationLabelEn: string;
  verificationLabelAr: string;
  repetitionNoteEn?: string;
  repetitionNoteAr?: string;
}

export interface DuaOccasion {
  id: string;
  categoryId: string;
  title: string;
  titleAr: string;
  subtitle?: string;
  subtitleAr?: string;
  entries: LibraryDuaEntry[];
}

export interface DuaCategoryItem {
  id: string;
  section: DuaSectionId;
  title: string;
  titleAr: string;
  icon: DuaIconKey;
  occasions: DuaOccasion[];
}

// Base authentic Hisn al-Muslim items
const HISN_ITEMS: Dua[] = (rawHisnAdhkar as unknown as Dua[]).map((d) => ({
  ...d,
  isSaved: false,
}));

function toLibraryEntry(dua: Dua): LibraryDuaEntry {
  const srcLower = (dua.source || '').toLowerCase();
  const isQuran =
    srcLower.includes('surah') ||
    srcLower.includes('سورة') ||
    srcLower.includes('al-baqarah') ||
    srcLower.includes('al-ikhlas') ||
    srcLower.includes('al-falaq') ||
    srcLower.includes('an-nas') ||
    srcLower.includes('آية');
  const isHasan = srcLower.includes('حسن') && !srcLower.includes('صحيح');

  const rep = dua.repetitions && dua.repetitions > 1 ? dua.repetitions : undefined;

  return {
    ...dua,
    verificationLevel: isQuran ? 'quran' : isHasan ? 'hasan' : 'sunnah',
    verificationLabelEn: isQuran
      ? 'Qur’an & Established Sunnah'
      : isHasan
      ? 'Established Hadith (Hisn al-Muslim)'
      : 'Established Sunnah (Hisn al-Muslim)',
    verificationLabelAr: isQuran
      ? 'من القرآن الكريم والسنة النبوية'
      : 'سنة ثابتة (حصن المسلم)',
    repetitionNoteEn: rep ? `Recite ${rep} times` : undefined,
    repetitionNoteAr: rep ? `يُقرأ ${rep} مرات` : undefined,
  };
}

function fromChapters(chapterIds: number[]): LibraryDuaEntry[] {
  const idSet = new Set(chapterIds);
  const seenArabic = new Set<string>();
  const results: LibraryDuaEntry[] = [];

  for (const item of HISN_ITEMS) {
    if (item.chapterId && idSet.has(item.chapterId)) {
      // Deduplicate identical morning/evening IDs if needed
      const key = `${item.id}`;
      if (!seenArabic.has(key)) {
        seenArabic.add(key);
        results.push(toLibraryEntry(item));
      }
    }
  }
  return results;
}

// Verified supplemental Qur'anic & Sahih Hadith entries for categories not covered by a dedicated Hisn al-Muslim chapter
export const SUPPLEMENTAL_DUAS: LibraryDuaEntry[] = [
  // ======================== RIZQ (SUSTENANCE) ========================
  {
    id: 'supp-rizq-1',
    title: 'Seeking Beneficial Knowledge, Halal Provision & Accepted Deeds',
    titleAr: 'سؤال الله العلم النافع والرزق الطيب والعمل المتقبل',
    category: 'Daily Dhikr',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا',
    transliteration: "Allāhumma innī as'aluka 'ilman nāfi'an, wa rizqan ṭayyiban, wa 'amalan mutaqabbalan.",
    translation: 'O Allah, indeed I ask You for beneficial knowledge, and goodly (halal) provision, and accepted deeds.',
    source: 'Sunan Ibn Majah 925 (Graded Sahih by Al-Albani); reported recited after the Fajr prayer salam by Umm Salamah (may Allah be pleased with her).',
    benefit: 'A concise prophetic supplication uniting the pillars of worldly and spiritual blessing after Fajr.',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah (Reported after Fajr)',
    verificationLabelAr: 'سنة ثابتة (يُقال بعد صلاة الفجر)',
    chapterTitle: 'Seeking Halal Sustenance (Rizq)',
    chapterTitleAr: 'طلب الرزق الحلال المبارك',
  },
  {
    id: 'supp-rizq-2',
    title: 'Sufficiency with What Allah Has Made Lawful',
    titleAr: 'الاستغناء بالحلال عن الحرام',
    category: 'Daily Dhikr',
    arabic: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
    transliteration: "Allāhumma-kfinī biḥalālika 'an ḥarāmika, wa aghninī bifaḍlika 'amman siwāk.",
    translation: 'O Allah, suffice me with what You have made lawful so I have no need of what You have made unlawful, and enrich me by Your bounty so I need none other than You.',
    source: 'Jami` at-Tirmidhi 3563 (Graded Hasan by At-Tirmidhi and Al-Albani).',
    benefit: 'Taught by the Prophet ﷺ for relief from financial hardship and heavy debt.',
    repetitions: 1,
    verificationLevel: 'hasan',
    verificationLabelEn: 'Established Hadith (Hasan)',
    verificationLabelAr: 'حديث حسن ثابت',
    chapterTitle: 'Seeking Halal Sustenance (Rizq)',
    chapterTitleAr: 'طلب الرزق الحلال المبارك',
  },
  {
    id: 'supp-rizq-3',
    title: 'Prophet Musa’s Supplication in Need',
    titleAr: 'دعاء نبي الله موسى عليه السلام عند الحاجة',
    category: 'Daily Dhikr',
    arabic: 'رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ',
    transliteration: "Rabbi innī limā anzalta ilayya min khayrin faqīr.",
    translation: 'My Lord, indeed I am in need of whatever good You would send down to me.',
    source: 'Qur’an — Surah Al-Qasas (28:24).',
    benefit: 'A Qur’anic supplication displaying complete humility before Allah while seeking provision and shelter.',
    repetitions: 1,
    verificationLevel: 'quran',
    verificationLabelEn: 'Qur’anic Supplication',
    verificationLabelAr: 'دعاء قرآني مبارك',
    chapterTitle: 'Seeking Halal Sustenance (Rizq)',
    chapterTitleAr: 'طلب الرزق الحلال المبارك',
  },

  // ======================== KNOWLEDGE ========================
  {
    id: 'supp-knowledge-1',
    title: 'Asking Allah to Increase You in Knowledge',
    titleAr: 'طلب الزيادة في العلم',
    category: 'Daily Dhikr',
    arabic: 'رَّبِّ زِدْنِي عِلْمًا',
    transliteration: "Rabbi zidnī 'ilmā.",
    translation: 'My Lord, increase me in knowledge.',
    source: 'Qur’an — Surah Taha (20:114).',
    benefit: 'Allah commanded His Prophet ﷺ in the Qur’an to ask for an increase in knowledge above all else.',
    repetitions: 1,
    verificationLevel: 'quran',
    verificationLabelEn: 'Qur’anic Command & Supplication',
    verificationLabelAr: 'دعاء قرآني مأثور',
    chapterTitle: 'Seeking Beneficial Knowledge',
    chapterTitleAr: 'طلب العلم النافع',
  },
  {
    id: 'supp-knowledge-2',
    title: 'Supplication for Beneficial & Practical Knowledge',
    titleAr: 'سؤال الله النفع بما علّمنا',
    category: 'Daily Dhikr',
    arabic: 'اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي، وَعَلِّمْنِي مَا يَنْفَعُنِي، وَزِدْنِي عِلْمًا',
    transliteration: "Allāhumma-nfa'nī bimā 'allamtanī, wa 'allimnī mā yanfa'unī, wa zidnī 'ilmā.",
    translation: 'O Allah, benefit me with that which You have taught me, teach me that which will benefit me, and increase me in knowledge.',
    source: 'Jami` at-Tirmidhi 3599 & Sunan Ibn Majah 251 (Graded Sahih by Al-Albani).',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah',
    verificationLabelAr: 'سنة نبوية ثابتة',
    chapterTitle: 'Seeking Beneficial Knowledge',
    chapterTitleAr: 'طلب العلم النافع',
  },
  {
    id: 'supp-knowledge-3',
    title: 'Seeking Refuge from Knowledge That Does Not Benefit',
    titleAr: 'الاستعاذة من علم لا ينفع',
    category: 'Protection',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عِلْمٍ لَا يَنْفَعُ، وَمِنْ قَلْبٍ لَا يَخْشَعُ، وَمِنْ نَفْسٍ لَا تَشْبَعُ، وَمِنْ دَعْوَةٍ لَا يُسْتَجَابُ لَهَا',
    transliteration: "Allāhumma innī a'ūdhu bika min 'ilmin lā yanfa', wa min qalbin lā yakhsha', wa min nafsin lā tashba', wa min da'watin lā yustajābu lahā.",
    translation: 'O Allah, I seek refuge in You from knowledge that does not benefit, from a heart that is not humble, from a soul that is never satisfied, and from a supplication that is not answered.',
    source: 'Sahih Muslim 2722.',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah (Sahih Muslim)',
    verificationLabelAr: 'حديث صحيح (رواه مسلم)',
    chapterTitle: 'Seeking Beneficial Knowledge',
    chapterTitleAr: 'طلب العلم النافع',
  },
  {
    id: 'supp-knowledge-4',
    title: 'Prophet Musa’s Supplication for Clarity & Ease of Speech',
    titleAr: 'دعاء شرح الصدر وتيسير الأمر',
    category: 'Daily Dhikr',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي ۝ وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي ۝ يَفْقَهُوا قَوْلِي',
    transliteration: "Rabbi-shraḥ lī ṣadrī, wa yassir lī amrī, waḥlul 'uqdatan min lisānī, yafqahū qawlī.",
    translation: 'My Lord, expand for me my chest (with assurance), ease for me my task, and untie the knot from my tongue that they may understand my speech.',
    source: 'Qur’an — Surah Taha (20:25–28).',
    repetitions: 1,
    verificationLevel: 'quran',
    verificationLabelEn: 'Qur’anic Supplication',
    verificationLabelAr: 'دعاء قرآني مبارك',
    chapterTitle: 'Seeking Beneficial Knowledge',
    chapterTitleAr: 'طلب العلم النافع',
  },

  // ======================== FAITH ========================
  {
    id: 'supp-faith-1',
    title: 'Steadfastness of the Heart Upon Religion',
    titleAr: 'دعاء تثبيت القلب على الدين',
    category: 'Daily Dhikr',
    arabic: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ',
    transliteration: "Yā Muqallibal-qulūb, thabbit qalbī 'alā dīnik.",
    translation: 'O Turner of the hearts, keep my heart firm upon Your religion.',
    source: 'Jami` at-Tirmidhi 2140 (Graded Sahih by Al-Albani); reported as the most frequent supplication of the Prophet ﷺ.',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah',
    verificationLabelAr: 'سنة نبوية ثابتة',
    chapterTitle: 'Steadfastness in Faith',
    chapterTitleAr: 'الثبات على الإيمان',
  },
  {
    id: 'supp-faith-2',
    title: 'Protection Against Deviation After Guidance',
    titleAr: 'سؤال الثبات على الهداية والرحمة',
    category: 'Daily Dhikr',
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ',
    transliteration: "Rabbanā lā tuzigh qulūbanā ba'da idh hadaytanā wa hab lanā min ladunka raḥmah, innaka Antal-Wahhāb.",
    translation: 'Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself. Indeed, You are the Bestower.',
    source: 'Qur’an — Surah Aal-e-Imran (3:8).',
    repetitions: 1,
    verificationLevel: 'quran',
    verificationLabelEn: 'Qur’anic Supplication',
    verificationLabelAr: 'دعاء قرآني مبارك',
    chapterTitle: 'Steadfastness in Faith',
    chapterTitleAr: 'الثبات على الإيمان',
  },

  // ======================== DAY OF JUDGEMENT ========================
  {
    id: 'supp-judgement-1',
    title: 'Good in This World, the Hereafter & Protection from the Fire',
    titleAr: 'سؤال الحسنة في الدنيا والآخرة والوقاية من النار',
    category: 'Daily Dhikr',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Rabbanā ātinā fid-dunyā ḥasanatan wa fil-ākhirati ḥasanatan wa qinā 'adhāban-nār.",
    translation: 'Our Lord, grant us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    source: 'Qur’an — Surah Al-Baqarah (2:201) & Sahih al-Bukhari 6389 (reported as the most frequent supplication of the Prophet ﷺ).',
    repetitions: 1,
    verificationLevel: 'quran',
    verificationLabelEn: 'Qur’an & Established Sunnah',
    verificationLabelAr: 'قرآن كريم وسنة ثابتة',
    chapterTitle: 'The Hereafter & Day of Judgement',
    chapterTitleAr: 'الآخرة ويوم القيامة',
  },
  {
    id: 'supp-judgement-2',
    title: 'Asking for an Easy Reckoning',
    titleAr: 'سؤال الحساب اليسير',
    category: 'Daily Dhikr',
    arabic: 'اللَّهُمَّ حَاسِبْنِي حِسَابًا يَسِيرًا',
    transliteration: "Allāhumma ḥāsibnī ḥisāban yasīrā.",
    translation: 'O Allah, call me to an easy reckoning.',
    source: 'Musnad Ahmad 24215; narrated by Aisha (may Allah be pleased with her) hearing the Prophet ﷺ supplicate during prayer.',
    benefit: 'The Prophet ﷺ explained that an easy reckoning means Allah looks at a servant’s record and overlooks his faults.',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Hadith',
    verificationLabelAr: 'حديث مأثور ثابت',
    chapterTitle: 'The Hereafter & Day of Judgement',
    chapterTitleAr: 'الآخرة ويوم القيامة',
  },
  {
    id: 'supp-judgement-3',
    title: 'Asking for Paradise & Refuge from the Hellfire',
    titleAr: 'سؤال الجنة والاستعاذة من النار',
    category: 'Daily Dhikr',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ',
    transliteration: "Allāhumma innī as'alukal-jannata wa a'ūdhu bika minan-nār.",
    translation: 'O Allah, I ask You for Paradise and I seek refuge in You from the Fire.',
    source: 'Sunan Abi Dawud 792 (Graded Sahih by Al-Albani).',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah',
    verificationLabelAr: 'سنة نبوية ثابتة',
    chapterTitle: 'The Hereafter & Day of Judgement',
    chapterTitleAr: 'الآخرة ويوم القيامة',
  },

  // ======================== PRAISING ALLAH ========================
  {
    id: 'supp-praise-1',
    title: 'Two Words Beloved to the Most Merciful',
    titleAr: 'كلمتان خفيفتان على اللسان ثقيلتان في الميزان',
    category: 'Gratitude',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    transliteration: "Subḥānallāhi wa biḥamdih, subḥānallāhil-'Aẓīm.",
    translation: 'Glory be to Allah and praise Him; Glory be to Allah, the Supreme.',
    source: 'Sahih al-Bukhari 6406 & Sahih Muslim 2694.',
    benefit: 'Two phrases light on the tongue, heavy on the Scale of deeds, and beloved to the Most Merciful.',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah (Bukhari & Muslim)',
    verificationLabelAr: 'متفق عليه (البخاري ومسلم)',
    chapterTitle: 'Words of Praise & Glorification',
    chapterTitleAr: 'كلمات التسبيح والتحميد',
  },
  {
    id: 'supp-praise-2',
    title: 'A Treasure from the Treasures of Paradise',
    titleAr: 'كنز من كنوز الجنة',
    category: 'Gratitude',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: "Lā ḥawla wa lā quwwata illā billāh.",
    translation: 'There is no might nor power except through Allah.',
    source: 'Sahih al-Bukhari 6384 & Sahih Muslim 2704.',
    benefit: 'Described by the Prophet ﷺ as one of the treasures beneath the Throne in Paradise.',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah (Bukhari & Muslim)',
    verificationLabelAr: 'متفق عليه (البخاري ومسلم)',
    chapterTitle: 'Words of Praise & Glorification',
    chapterTitleAr: 'كلمات التسبيح والتحميد',
  },
  {
    id: 'supp-praise-3',
    title: 'Abundant, Pure & Blessed Praise',
    titleAr: 'الحمد الكثير الطيب المبارك',
    category: 'Gratitude',
    arabic: 'رَبَّنَا وَلَكَ الْحَمْدُ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ',
    transliteration: "Rabbanā wa lakal-ḥamdu ḥamdan kathīran ṭayyiban mubārakan fīh.",
    translation: 'Our Lord, to You be praise — abundant, pure, and blessed praise.',
    source: 'Sahih al-Bukhari 799.',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah (Sahih al-Bukhari)',
    verificationLabelAr: 'حديث صحيح (رواه البخاري)',
    chapterTitle: 'Words of Praise & Glorification',
    chapterTitleAr: 'كلمات التسبيح والتحميد',
  },

  // ======================== FAMILY ========================
  {
    id: 'supp-family-1',
    title: 'Righteous Spouses & Offspring',
    titleAr: 'الدعاء بصلاح الأزواج والذرية',
    category: 'Daily Dhikr',
    arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    transliteration: "Rabbanā hab lanā min azwājinā wa dhurriyyātinā qurrata a'yunin waj'alnā lil-muttaqīna imāmā.",
    translation: 'Our Lord, grant us from among our spouses and offspring comfort to our eyes, and make us leaders for the righteous.',
    source: 'Qur’an — Surah Al-Furqan (25:74).',
    repetitions: 1,
    verificationLevel: 'quran',
    verificationLabelEn: 'Qur’anic Supplication',
    verificationLabelAr: 'دعاء قرآني مبارك',
    chapterTitle: 'For Parents, Spouse & Offspring',
    chapterTitleAr: 'الدعاء للوالدين والأهل والذرية',
  },
  {
    id: 'supp-family-2',
    title: 'Mercy for Parents',
    titleAr: 'الدعاء للوالدين بالرحمة',
    category: 'Daily Dhikr',
    arabic: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    transliteration: "Rabbir-ḥamhumā kamā rabbayānī ṣaghīrā.",
    translation: 'My Lord, have mercy upon them both as they brought me up when I was small.',
    source: 'Qur’an — Surah Al-Isra (17:24).',
    repetitions: 1,
    verificationLevel: 'quran',
    verificationLabelEn: 'Qur’anic Supplication',
    verificationLabelAr: 'دعاء قرآني مبارك',
    chapterTitle: 'For Parents, Spouse & Offspring',
    chapterTitleAr: 'الدعاء للوالدين والأهل والذرية',
  },
  {
    id: 'supp-family-3',
    title: 'Gratitude & Righteousness for Offspring',
    titleAr: 'الدعاء بصلاح الذرية وشكر النعمة',
    category: 'Daily Dhikr',
    arabic: 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَصْلِحْ لِي فِي ذُرِّيَّتِي ۖ إِنِّي تُبْتُ إِلَيْكَ وَإِنِّي مِنَ الْمُسْلِمِينَ',
    transliteration: "Rabbi awzi'nī an ashkura ni'matakal-latī an'amta 'alayya wa 'alā wālidayya wa an a'mala ṣāliḥan tarḍāhu wa aṣliḥ lī fī dhurriyyatī, innī tubtu ilayka wa innī minal-muslimīn.",
    translation: 'My Lord, enable me to be grateful for Your favor which You have bestowed upon me and upon my parents and to work righteousness of which You will approve, and make righteous for me my offspring. Indeed, I have repented to You, and indeed I am of the Muslims.',
    source: 'Qur’an — Surah Al-Ahqaf (46:15).',
    repetitions: 1,
    verificationLevel: 'quran',
    verificationLabelEn: 'Qur’anic Supplication',
    verificationLabelAr: 'دعاء قرآني مبارك',
    chapterTitle: 'For Parents, Spouse & Offspring',
    chapterTitleAr: 'الدعاء للوالدين والأهل والذرية',
  },

  // ======================== PATIENCE ========================
  {
    id: 'supp-patience-1',
    title: 'Pouring Forth Patience & Making Feet Firm',
    titleAr: 'سؤال إفراغ الصبر وتثبيت الأقدام',
    category: 'Daily Dhikr',
    arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
    transliteration: "Rabbanā afrigh 'alaynā ṣabran wa thabbit aqdāmanā wanṣurnā 'alal-qawmil-kāfirīn.",
    translation: 'Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people.',
    source: 'Qur’an — Surah Al-Baqarah (2:250).',
    repetitions: 1,
    verificationLevel: 'quran',
    verificationLabelEn: 'Qur’anic Supplication',
    verificationLabelAr: 'دعاء قرآني مبارك',
    chapterTitle: 'Patience & Perseverance',
    chapterTitleAr: 'الصبر والثبات عند البلاء',
  },
  {
    id: 'supp-patience-2',
    title: 'Patience & Dying Upon Islam',
    titleAr: 'طلب الصبر والوفاة على الإسلام',
    category: 'Daily Dhikr',
    arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَوَفَّنَا مُسْلِمِينَ',
    transliteration: "Rabbanā afrigh 'alaynā ṣabran wa tawaffanā muslimīn.",
    translation: 'Our Lord, pour upon us patience and let us die as Muslims [in submission to You].',
    source: 'Qur’an — Surah Al-A`raf (7:126).',
    repetitions: 1,
    verificationLevel: 'quran',
    verificationLabelEn: 'Qur’anic Supplication',
    verificationLabelAr: 'دعاء قرآني مبارك',
    chapterTitle: 'Patience & Perseverance',
    chapterTitleAr: 'الصبر والثبات عند البلاء',
  },
  {
    id: 'supp-patience-3',
    title: 'Contentment After the Divine Decree',
    titleAr: 'سؤال الرضا بعد القضاء وبرد العيش',
    category: 'Daily Dhikr',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الرِّضَا بَعْدَ الْقَضَاءِ، وَأَسْأَلُكَ بَرْدَ الْعَيْشِ بَعْدَ الْمَوْتِ',
    transliteration: "Allāhumma innī as'alukar-riḍā ba'dal-qaḍā', wa as'aluka bardal-'ayshi ba'dal-mawt.",
    translation: 'O Allah, I ask You for contentment after Your decree, and I ask You for a pleasant life after death.',
    source: 'Sunan an-Nasa`i 1305 (Graded Sahih by Al-Albani).',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah',
    verificationLabelAr: 'سنة نبوية ثابتة',
    chapterTitle: 'Patience & Perseverance',
    chapterTitleAr: 'الصبر والثبات عند البلاء',
  },

  // ======================== DEBT ADDITION ========================
  {
    id: 'supp-debt-1',
    title: 'Refuge from the Burden of Debt & Overpowering Men',
    titleAr: 'الاستعاذة من ضلع الدّين وغلبة الرجال',
    category: 'Protection',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْجُبْنِ وَالْبُخْلِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ',
    transliteration: "Allāhumma innī a'ūdhu bika minal-hammi wal-ḥazan, wal-'ajzi wal-kasal, wal-jubni wal-bukhl, wa ḍala'id-dayni wa ghalabatir-rijāl.",
    translation: 'O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, from being heavily in debt and from being overpowered by men.',
    source: 'Sahih al-Bukhari 6369.',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah (Sahih al-Bukhari)',
    verificationLabelAr: 'حديث صحيح (رواه البخاري)',
    chapterTitle: 'Refuge from Debt & Burden',
    chapterTitleAr: 'الاستعاذة من غلبة الدّين والهم',
  },

  // ======================== DURING MENSTRUATION ========================
  {
    id: 'supp-menstruation-1',
    title: 'Continuous Remembrance in Every State (Scholarly Guidance)',
    titleAr: 'مشروعية الذكر والاستغفار والدعاء في كل حال',
    category: 'Daily Dhikr',
    arabic: 'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ، أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: "Subḥānallāhi wal-ḥamdulillāhi wa lā ilāha illallāhu wallāhu akbar, wa lā ḥawla wa lā quwwata illā billāh; astaghfirullāha wa atūbu ilayh.",
    translation: 'Glory be to Allah, all praise is due to Allah, there is no deity worthy of worship except Allah, Allah is the Greatest, and there is no might or power except through Allah. I seek Allah’s forgiveness and repent to Him.',
    source: 'Verified Scholarly Note: There is no single Sahih Hadith prescribing a special invocation unique only to menstruation. However, by consensus based on Sahih al-Bukhari 305 and Sahih Muslim 302 (that the Prophet ﷺ remembered Allah at all times and Aisha رضي الله عنها was told to perform all acts except Tawaf/Salah), a woman in menstruation is fully encouraged to recite all general Adhkar, Tasbih, Istighfar, Salawat, morning/evening remembrances, and supplications.',
    benefit: 'Distinction of Source: General remembrances and supplications remain open and rewarded throughout menstruation without restriction.',
    repetitions: 1,
    verificationLevel: 'guidance',
    verificationLabelEn: 'Verified Sunnah Principle · No Specific Wording Exclusively Narrated',
    verificationLabelAr: 'توضيح شرعي موثق (الأذكار العامة مشروعة ولا يخصها ذكر منفرد ثابت)',
    chapterTitle: 'Permitted Remembrances During Menstruation',
    chapterTitleAr: 'الأذكار المشروعة والتوضيح الفقهي',
  },

  // ======================== RAMADAN — LAYLAT AL-QADR ========================
  {
    id: 'supp-ramadan-qadr',
    title: 'Supplication for Laylat al-Qadr (Night of Decree)',
    titleAr: 'دعاء ليلة القدر',
    category: 'Forgiveness',
    arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    transliteration: "Allāhumma innaka 'Afuwwun tuḥibbul-'afwa fa'fu 'annī.",
    translation: 'O Allah, indeed You are Pardoning and love to pardon, so pardon me.',
    source: 'Jami` at-Tirmidhi 3513 & Sunan Ibn Majah 3850 (Graded Sahih by At-Tirmidhi and Al-Albani). Taught directly by the Prophet ﷺ to Aisha (may Allah be pleased with her) when she asked what to say on Laylat al-Qadr.',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah (Tirmidhi 3513)',
    verificationLabelAr: 'سنة ثابتة (رواه الترمذي)',
    chapterTitle: 'Laylat al-Qadr Supplication',
    chapterTitleAr: 'دعاء ليلة القدر',
  },

  // ======================== DECISION / GUIDANCE ========================
  {
    id: 'supp-guidance-1',
    title: 'Asking Allah for Guidance, Piety, Chastity & Contentment',
    titleAr: 'سؤال الله الهدى والتقى والعفاف والغنى',
    category: 'Daily Dhikr',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى',
    transliteration: "Allāhumma innī as'alukal-hudā wat-tuqā wal-'afāfa wal-ghinā.",
    translation: 'O Allah, indeed I ask You for guidance, piety, chastity (self-restraint), and sufficiency.',
    source: 'Sahih Muslim 2721.',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah (Sahih Muslim)',
    verificationLabelAr: 'حديث صحيح (رواه مسلم)',
    chapterTitle: 'Seeking Guidance & Uprightness',
    chapterTitleAr: 'طلب الهداية والسداد',
  },
  {
    id: 'supp-guidance-2',
    title: 'Asking Allah for Guidance & Uprightness',
    titleAr: 'سؤال الله الهداية والسداد',
    category: 'Daily Dhikr',
    arabic: 'اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي',
    transliteration: "Allāhumma-hdinī wa saddidnī.",
    translation: 'O Allah, guide me and keep me upright on the right course.',
    source: 'Sahih Muslim 2725.',
    repetitions: 1,
    verificationLevel: 'sunnah',
    verificationLabelEn: 'Established Sunnah (Sahih Muslim)',
    verificationLabelAr: 'حديث صحيح (رواه مسلم)',
    chapterTitle: 'Seeking Guidance & Uprightness',
    chapterTitleAr: 'طلب الهداية والسداد',
  },
  {
    id: 'supp-guidance-3',
    title: 'Guidance to the Straight Path',
    titleAr: 'طلب الهداية للصراط المستقيم',
    category: 'Daily Dhikr',
    arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
    transliteration: "Ihdinaṣ-ṣirāṭal-mustaqīm.",
    translation: 'Guide us to the straight path.',
    source: 'Qur’an — Surah Al-Fatihah (1:6).',
    repetitions: 1,
    verificationLevel: 'quran',
    verificationLabelEn: 'Qur’anic Supplication',
    verificationLabelAr: 'دعاء قرآني مبارك',
    chapterTitle: 'Seeking Guidance & Uprightness',
    chapterTitleAr: 'طلب الهداية والسداد',
  },
];

function getSup(id: string): LibraryDuaEntry {
  const found = SUPPLEMENTAL_DUAS.find((d) => d.id === id);
  if (!found) {
    throw new Error(`Missing supplemental dua: ${id}`);
  }
  return found;
}

const MORNING_ADHKAR = HISN_ITEMS.filter(
  (d) => d.chapterId === 27 && (d.category === 'Morning' || d.id.endsWith('-m'))
).map(toLibraryEntry);

const EVENING_ADHKAR = HISN_ITEMS.filter(
  (d) => d.chapterId === 27 && (d.category === 'Evening' || d.id.endsWith('-e'))
).map(toLibraryEntry);

export const DUAS_CATEGORIES_LIBRARY: DuaCategoryItem[] = [
  // ============================================================================
  // SECTION 1: DAILY (exact order from specification)
  // ============================================================================
  {
    id: 'sleeping',
    section: 'DAILY',
    title: 'Sleeping',
    titleAr: 'النوم والاستيقاظ',
    icon: 'moon',
    occasions: [
      {
        id: 'sleeping-wake-up',
        categoryId: 'sleeping',
        title: 'When you wake up',
        titleAr: 'عند الاستيقاظ من النوم',
        entries: fromChapters([1]),
      },
      {
        id: 'sleeping-before-sleep',
        categoryId: 'sleeping',
        title: 'Before sleeping',
        titleAr: 'قبل النوم',
        entries: fromChapters([28]),
      },
      {
        id: 'sleeping-night-stir',
        categoryId: 'sleeping',
        title: 'Upon waking during the night',
        titleAr: 'إذا تقلب أو استيقظ ليلاً',
        entries: fromChapters([29]),
      },
      {
        id: 'sleeping-anxiety',
        categoryId: 'sleeping',
        title: 'Anxiety or loneliness before sleep',
        titleAr: 'القلق والفزع والوحشة في النوم',
        entries: fromChapters([30]),
      },
      {
        id: 'sleeping-dreams',
        categoryId: 'sleeping',
        title: 'Seeing a good or bad dream',
        titleAr: 'عند رؤية الرؤيا أو الحلم',
        entries: fromChapters([31]),
      },
    ],
  },
  {
    id: 'toilet',
    section: 'DAILY',
    title: 'Toilet',
    titleAr: 'الخلاء',
    icon: 'toilet',
    occasions: [
      {
        id: 'toilet-enter',
        categoryId: 'toilet',
        title: 'Before entering the toilet',
        titleAr: 'دعاء دخول الخلاء',
        entries: fromChapters([6]),
      },
      {
        id: 'toilet-leave',
        categoryId: 'toilet',
        title: 'After leaving the toilet',
        titleAr: 'دعاء الخروج من الخلاء',
        entries: fromChapters([7]),
      },
    ],
  },
  {
    id: 'ablution',
    section: 'DAILY',
    title: 'Ablution',
    titleAr: 'الوضوء',
    icon: 'droplets',
    occasions: [
      {
        id: 'ablution-before',
        categoryId: 'ablution',
        title: 'Before performing ablution',
        titleAr: 'الذكر قبل الوضوء',
        entries: fromChapters([8]),
      },
      {
        id: 'ablution-after',
        categoryId: 'ablution',
        title: 'Upon completing ablution',
        titleAr: 'الذكر بعد الفراغ من الوضوء',
        entries: fromChapters([9]),
      },
    ],
  },
  {
    id: 'mosque',
    section: 'DAILY',
    title: 'Mosque',
    titleAr: 'المسجد والأذان',
    icon: 'mosque',
    occasions: [
      {
        id: 'mosque-going',
        categoryId: 'mosque',
        title: 'Going to the mosque',
        titleAr: 'دعاء الذهاب إلى المسجد',
        entries: fromChapters([12]),
      },
      {
        id: 'mosque-entering',
        categoryId: 'mosque',
        title: 'Entering the mosque',
        titleAr: 'دعاء دخول المسجد',
        entries: fromChapters([13]),
      },
      {
        id: 'mosque-leaving',
        categoryId: 'mosque',
        title: 'Leaving the mosque',
        titleAr: 'دعاء الخروج من المسجد',
        entries: fromChapters([14]),
      },
      {
        id: 'mosque-adhan',
        categoryId: 'mosque',
        title: 'Upon hearing the Adhan',
        titleAr: 'أذكار الأذان',
        entries: fromChapters([15]),
      },
    ],
  },
  {
    id: 'prayer',
    section: 'DAILY',
    title: 'Prayer',
    titleAr: 'الصلاة',
    icon: 'prayer',
    occasions: [
      {
        id: 'prayer-opening',
        categoryId: 'prayer',
        title: 'Opening of prayer (Istiftah)',
        titleAr: 'دعاء الاستفتاح',
        entries: fromChapters([16]),
      },
      {
        id: 'prayer-ruku',
        categoryId: 'prayer',
        title: 'During bowing (Ruku`)',
        titleAr: 'دعاء الركوع',
        entries: fromChapters([17]),
      },
      {
        id: 'prayer-rising',
        categoryId: 'prayer',
        title: 'Rising from bowing',
        titleAr: 'دعاء الرفع من الركوع',
        entries: fromChapters([18]),
      },
      {
        id: 'prayer-sujood',
        categoryId: 'prayer',
        title: 'During prostration (Sujood)',
        titleAr: 'دعاء السجود',
        entries: fromChapters([19]),
      },
      {
        id: 'prayer-between-sujood',
        categoryId: 'prayer',
        title: 'Between the two prostrations',
        titleAr: 'دعاء الجلسة بين السجدتين',
        entries: fromChapters([20]),
      },
      {
        id: 'prayer-tilawah',
        categoryId: 'prayer',
        title: 'Prostration of Qur’an recitation',
        titleAr: 'دعاء سجود التلاوة',
        entries: fromChapters([21]),
      },
      {
        id: 'prayer-tashahhud',
        categoryId: 'prayer',
        title: 'At-Tashahhud & Salawat',
        titleAr: 'التشهد والصلاة على النبي ﷺ',
        entries: fromChapters([22, 23]),
      },
      {
        id: 'prayer-before-salam',
        categoryId: 'prayer',
        title: 'After final Tashahhud before Salam',
        titleAr: 'الدعاء بعد التشهد الأخير وقبل السلام',
        entries: fromChapters([24]),
      },
      {
        id: 'prayer-witr-qunut',
        categoryId: 'prayer',
        title: 'Qunut in the Witr prayer',
        titleAr: 'دعاء قنوت الوتر',
        entries: fromChapters([32]),
      },
      {
        id: 'prayer-distraction',
        categoryId: 'prayer',
        title: 'Against whispering during prayer',
        titleAr: 'دعاء الوسوسة في الصلاة والقراءة',
        entries: fromChapters([42]),
      },
    ],
  },
  {
    id: 'home',
    section: 'DAILY',
    title: 'Home',
    titleAr: 'المنزل',
    icon: 'home',
    occasions: [
      {
        id: 'home-leaving',
        categoryId: 'home',
        title: 'When leaving home',
        titleAr: 'الذكر عند الخروج من المنزل',
        entries: fromChapters([10]),
      },
      {
        id: 'home-entering',
        categoryId: 'home',
        title: 'When entering home',
        titleAr: 'الذكر عند دخول المنزل',
        entries: fromChapters([11]),
      },
    ],
  },
  {
    id: 'garment',
    section: 'DAILY',
    title: 'Garment',
    titleAr: 'اللباس',
    icon: 'garment',
    occasions: [
      {
        id: 'garment-getting-dressed',
        categoryId: 'garment',
        title: 'When getting dressed',
        titleAr: 'دعاء لبس الثوب',
        entries: fromChapters([2]),
      },
      {
        id: 'garment-new-clothes',
        categoryId: 'garment',
        title: 'Putting on new clothes',
        titleAr: 'دعاء لبس الثوب الجديد',
        entries: fromChapters([3]),
      },
      {
        id: 'garment-for-another',
        categoryId: 'garment',
        title: 'For someone wearing new clothes',
        titleAr: 'الدعاء لمن لبس ثوباً جديداً',
        entries: fromChapters([4]),
      },
      {
        id: 'garment-undressing',
        categoryId: 'garment',
        title: 'When undressing',
        titleAr: 'ما يقول إذا وضع الثوب',
        entries: fromChapters([5]),
      },
    ],
  },
  {
    id: 'travel',
    section: 'DAILY',
    title: 'Travel',
    titleAr: 'السفر',
    icon: 'travel',
    occasions: [
      {
        id: 'travel-riding',
        categoryId: 'travel',
        title: 'Mounting a vehicle or transport',
        titleAr: 'دعاء ركوب الدابة أو المركوب',
        entries: fromChapters([95]),
      },
      {
        id: 'travel-journey',
        categoryId: 'travel',
        title: 'Invocation for traveling',
        titleAr: 'دعاء السفر',
        entries: fromChapters([96]),
      },
      {
        id: 'travel-town-market',
        categoryId: 'travel',
        title: 'Entering a town or market',
        titleAr: 'دعاء دخول القرية والسوق',
        entries: fromChapters([97, 98]),
      },
      {
        id: 'travel-mutual',
        categoryId: 'travel',
        title: 'Traveler & resident prayers for each other',
        titleAr: 'دعاء المسافر للمقيم والمقيم للمسافر',
        entries: fromChapters([100, 101]),
      },
      {
        id: 'travel-along-way',
        categoryId: 'travel',
        title: 'Along the journey, dawn & layovers',
        titleAr: 'التكبير والذكر في السفر والنزول',
        entries: fromChapters([99, 102, 103, 104]),
      },
      {
        id: 'travel-returning',
        categoryId: 'travel',
        title: 'Upon returning from travel',
        titleAr: 'ذكر الرجوع من السفر',
        entries: fromChapters([105]),
      },
    ],
  },
  {
    id: 'food',
    section: 'DAILY',
    title: 'Food',
    titleAr: 'الطعام والشراب',
    icon: 'food',
    occasions: [
      {
        id: 'food-before-eating',
        categoryId: 'food',
        title: 'Before eating',
        titleAr: 'الدعاء قبل الطعام',
        entries: fromChapters([69]),
      },
      {
        id: 'food-after-eating',
        categoryId: 'food',
        title: 'After eating',
        titleAr: 'الدعاء عند الفراغ من الطعام',
        entries: fromChapters([70]),
      },
      {
        id: 'food-host-drink',
        categoryId: 'food',
        title: 'For the host or one offering drink',
        titleAr: 'دعاء الضيف لصاحب الطعام ولمن سقاه',
        entries: fromChapters([71, 72]),
      },
      {
        id: 'food-first-fruits',
        categoryId: 'food',
        title: 'Seeing the first fruits of the season',
        titleAr: 'الدعاء عند رؤية باكورة الثمر',
        entries: fromChapters([76]),
      },
    ],
  },

  // ============================================================================
  // SECTION 2: AZKAR (exact order from specification)
  // ============================================================================
  {
    id: 'daily-dhikr',
    section: 'AZKAR',
    title: 'Daily Dhikr',
    titleAr: 'أذكار الصباح والمساء',
    icon: 'sun',
    occasions: [
      {
        id: 'daily-dhikr-morning',
        categoryId: 'daily-dhikr',
        title: 'Morning Adhkar',
        titleAr: 'أذكار الصباح',
        entries: MORNING_ADHKAR,
      },
      {
        id: 'daily-dhikr-evening',
        categoryId: 'daily-dhikr',
        title: 'Evening Adhkar',
        titleAr: 'أذكار المساء',
        entries: EVENING_ADHKAR,
      },
    ],
  },
  {
    id: 'daily-remembrance',
    section: 'AZKAR',
    title: 'Daily Remembrance',
    titleAr: 'الأذكار اليومية العامة',
    icon: 'remembrance',
    occasions: [
      {
        id: 'remembrance-excellence',
        categoryId: 'daily-remembrance',
        title: 'Excellence of Tasbih, Tahmid, Tahlil & Takbir',
        titleAr: 'فضل التسبيح والتحميد والتهليل والتكبير',
        entries: fromChapters([130, 131]),
      },
      {
        id: 'remembrance-gathering',
        categoryId: 'daily-remembrance',
        title: 'Remembrance in a gathering & its expiation',
        titleAr: 'ما يُقال في المجلس وكفارة المجلس',
        entries: fromChapters([84, 85]),
      },
    ],
  },
  {
    id: 'after-prayers',
    section: 'AZKAR',
    title: 'After Prayers',
    titleAr: 'أذكار بعد الصلاة',
    icon: 'after-prayers',
    occasions: [
      {
        id: 'after-prayers-obligatory',
        categoryId: 'after-prayers',
        title: 'After the Salam of prayer',
        titleAr: 'الأذكار بعد السلام من الصلاة',
        entries: fromChapters([25]),
      },
      {
        id: 'after-prayers-witr',
        categoryId: 'after-prayers',
        title: 'Immediately after Witr prayer',
        titleAr: 'الذكر عقب السلام من الوتر',
        entries: fromChapters([33]),
      },
    ],
  },
  {
    id: 'rizq',
    section: 'AZKAR',
    title: 'Rizq (Sustenance)',
    titleAr: 'الرزق الحلال',
    icon: 'rizq',
    occasions: [
      {
        id: 'rizq-halal',
        categoryId: 'rizq',
        title: 'Seeking halal & blessed provision',
        titleAr: 'طلب الرزق الطيب الحلال',
        entries: [getSup('supp-rizq-1'), getSup('supp-rizq-2'), getSup('supp-rizq-3')],
      },
    ],
  },
  {
    id: 'knowledge',
    section: 'AZKAR',
    title: 'Knowledge',
    titleAr: 'العلم النافع',
    icon: 'knowledge',
    occasions: [
      {
        id: 'knowledge-beneficial',
        categoryId: 'knowledge',
        title: 'Seeking beneficial knowledge & clarity',
        titleAr: 'طلب العلم النافع وشرح الصدر',
        entries: [
          getSup('supp-knowledge-1'),
          getSup('supp-knowledge-2'),
          getSup('supp-knowledge-3'),
          getSup('supp-knowledge-4'),
        ],
      },
    ],
  },
  {
    id: 'faith',
    section: 'AZKAR',
    title: 'Faith',
    titleAr: 'الإيمان والثبات',
    icon: 'faith',
    occasions: [
      {
        id: 'faith-steadfastness',
        categoryId: 'faith',
        title: 'Steadfastness upon guidance',
        titleAr: 'تثبيت القلب على الإيمان',
        entries: [getSup('supp-faith-1'), getSup('supp-faith-2')],
      },
      {
        id: 'faith-doubt',
        categoryId: 'faith',
        title: 'When experiencing doubt in faith',
        titleAr: 'دعاء من أصابه شك في الإيمان',
        entries: fromChapters([40]),
      },
      {
        id: 'faith-shirk',
        categoryId: 'faith',
        title: 'Protection from Shirk',
        titleAr: 'دعاء الخوف من الشرك',
        entries: fromChapters([92]),
      },
    ],
  },
  {
    id: 'day-of-judgement',
    section: 'AZKAR',
    title: 'Day of Judgement',
    titleAr: 'الآخرة ويوم القيامة',
    icon: 'judgement',
    occasions: [
      {
        id: 'judgement-reckoning',
        categoryId: 'day-of-judgement',
        title: 'Easy reckoning, Paradise & refuge from the Fire',
        titleAr: 'الحساب اليسير وسؤال الجنة والنجاة من النار',
        entries: [getSup('supp-judgement-1'), getSup('supp-judgement-2'), getSup('supp-judgement-3')],
      },
    ],
  },
  {
    id: 'forgiveness',
    section: 'AZKAR',
    title: 'Forgiveness',
    titleAr: 'الاستغفار والتوبة',
    icon: 'forgiveness',
    occasions: [
      {
        id: 'forgiveness-repentance',
        categoryId: 'forgiveness',
        title: 'Seeking forgiveness & Sayyid al-Istighfar',
        titleAr: 'الاستغفار والتوبة وسيد الاستغفار',
        entries: fromChapters([129]),
      },
      {
        id: 'forgiveness-sin',
        categoryId: 'forgiveness',
        title: 'What to do and say after committing a sin',
        titleAr: 'ما يقول ويفعل من أذنب ذنباً',
        entries: fromChapters([44]),
      },
      {
        id: 'forgiveness-reply',
        categoryId: 'forgiveness',
        title: 'For someone who says "May Allah forgive you"',
        titleAr: 'الدعاء لمن قال غفر الله لك',
        entries: fromChapters([86]),
      },
    ],
  },
  {
    id: 'praising-allah',
    section: 'AZKAR',
    title: 'Praising Allah',
    titleAr: 'التسبيح والحمد والثناء',
    icon: 'praising',
    occasions: [
      {
        id: 'praising-tasbih',
        categoryId: 'praising-allah',
        title: 'Words of praise & glorification',
        titleAr: 'كلمات التسبيح والحمد العظيمة',
        entries: [getSup('supp-praise-1'), getSup('supp-praise-2'), getSup('supp-praise-3')],
      },
      {
        id: 'praising-salawat',
        categoryId: 'praising-allah',
        title: 'Sending blessings upon the Prophet ﷺ',
        titleAr: 'فضل الصلاة على النبي صلى الله عليه وسلم',
        entries: fromChapters([107]),
      },
    ],
  },
  {
    id: 'protection',
    section: 'AZKAR',
    title: 'Protection',
    titleAr: 'الحفظ والوقاية',
    icon: 'protection',
    occasions: [
      {
        id: 'protection-children',
        categoryId: 'protection',
        title: 'Seeking Allah’s protection for children',
        titleAr: 'ما يُعوَّذ به الأولاد',
        entries: fromChapters([48]),
      },
      {
        id: 'protection-shaytan',
        categoryId: 'protection',
        title: 'Against the Devil and his whisperings',
        titleAr: 'طرد الشيطان ووساوسه',
        entries: fromChapters([45, 128]),
      },
      {
        id: 'protection-evil-eye',
        categoryId: 'protection',
        title: 'Fear of afflicting with the evil eye & fright',
        titleAr: 'الوقاية من العين وعند الفزع',
        entries: fromChapters([125, 126]),
      },
      {
        id: 'protection-harm',
        categoryId: 'protection',
        title: 'Against oppression, adversaries & harm',
        titleAr: 'دعاء لقاء العدو وظلم السلطان ومن خاف قوماً',
        entries: fromChapters([36, 37, 38, 39]),
      },
      {
        id: 'protection-dajjal',
        categoryId: 'protection',
        title: 'Protection from Al-Masih ad-Dajjal',
        titleAr: 'ما يُعصم به من الدجال',
        entries: fromChapters([88]),
      },
    ],
  },
  {
    id: 'family',
    section: 'AZKAR',
    title: 'Family',
    titleAr: 'الأسرة والأهل',
    icon: 'family',
    occasions: [
      {
        id: 'family-parents-offspring',
        categoryId: 'family',
        title: 'For parents, spouse & righteous offspring',
        titleAr: 'الدعاء للوالدين والأزواج والذرية',
        entries: [getSup('supp-family-1'), getSup('supp-family-2'), getSup('supp-family-3')],
      },
      {
        id: 'family-newborn',
        categoryId: 'family',
        title: 'Congratulations for a newborn',
        titleAr: 'تهنئة المولود له وجوابه',
        entries: fromChapters([47]),
      },
      {
        id: 'family-marriage',
        categoryId: 'family',
        title: 'For the newlyweds & marriage',
        titleAr: 'الدعاء للمتزوج وآداب النكاح',
        entries: fromChapters([79, 80, 81]),
      },
    ],
  },
  {
    id: 'health-illness',
    section: 'AZKAR',
    title: 'Health / Illness',
    titleAr: 'الصحة والمرض',
    icon: 'health',
    occasions: [
      {
        id: 'health-visiting-sick',
        categoryId: 'health-illness',
        title: 'Visiting the sick & its reward',
        titleAr: 'الدعاء للمريض في عيادته وفضلها',
        entries: fromChapters([49, 50]),
      },
      {
        id: 'health-body-pain',
        categoryId: 'health-illness',
        title: 'When feeling pain in the body',
        titleAr: 'ما يقول من أحسّ وجعاً في جسده',
        entries: fromChapters([124]),
      },
      {
        id: 'health-severe-illness',
        categoryId: 'health-illness',
        title: 'Invocations for severe illness',
        titleAr: 'دعاء المريض الذي يئس من حياته',
        entries: fromChapters([51]),
      },
    ],
  },
  {
    id: 'loss-failure',
    section: 'AZKAR',
    title: 'Loss / Failure',
    titleAr: 'المصيبة والتعثر',
    icon: 'loss',
    occasions: [
      {
        id: 'loss-tragedy',
        categoryId: 'loss-failure',
        title: 'When tragedy or loss strikes',
        titleAr: 'دعاء من أُصيب بمصيبة',
        entries: fromChapters([53]),
      },
      {
        id: 'loss-disliked-outcome',
        categoryId: 'loss-failure',
        title: 'When something disliked or setback happens',
        titleAr: 'الدعاء حين يقع ما لا يرضاه أو غُلِب على أمره',
        entries: fromChapters([46]),
      },
      {
        id: 'loss-difficulty',
        categoryId: 'loss-failure',
        title: 'When something becomes difficult',
        titleAr: 'دعاء من استصعب عليه أمر',
        entries: fromChapters([43]),
      },
    ],
  },
  {
    id: 'sorrow-joy',
    section: 'AZKAR',
    title: 'Sorrow / Joy',
    titleAr: 'الحزن والفرح',
    icon: 'sorrow-joy',
    occasions: [
      {
        id: 'sorrow-worry-grief',
        categoryId: 'sorrow-joy',
        title: 'In times of worry & grief',
        titleAr: 'دعاء الهم والحزن',
        entries: fromChapters([34]),
      },
      {
        id: 'sorrow-anguish',
        categoryId: 'sorrow-joy',
        title: 'In times of severe distress',
        titleAr: 'دعاء الكرب',
        entries: fromChapters([35]),
      },
      {
        id: 'sorrow-joy-news',
        categoryId: 'sorrow-joy',
        title: 'When something pleasing or surprising occurs',
        titleAr: 'ما يقول عند الأمر السار والتعجب',
        entries: fromChapters([106, 122, 123]),
      },
    ],
  },
  {
    id: 'patience',
    section: 'AZKAR',
    title: 'Patience',
    titleAr: 'الصبر والثبات',
    icon: 'patience',
    occasions: [
      {
        id: 'patience-perseverance',
        categoryId: 'patience',
        title: 'Supplications for patience & contentment',
        titleAr: 'أدعية الصبر والرضا بالقضاء',
        entries: [getSup('supp-patience-1'), getSup('supp-patience-2'), getSup('supp-patience-3')],
      },
    ],
  },
  {
    id: 'debt',
    section: 'AZKAR',
    title: 'Debt',
    titleAr: 'قضاء الدَّين',
    icon: 'debt',
    occasions: [
      {
        id: 'debt-relief',
        categoryId: 'debt',
        title: 'For settling & relief from debt',
        titleAr: 'دعاء قضاء الدَّين',
        entries: [...fromChapters([41]), getSup('supp-debt-1')],
      },
      {
        id: 'debt-repay-lender',
        categoryId: 'debt',
        title: 'For a lender upon repaying a loan',
        titleAr: 'الدعاء لمن أقرض عند القضاء',
        entries: fromChapters([91]),
      },
    ],
  },
  {
    id: 'during-menstruation',
    section: 'AZKAR',
    title: 'During Menstruation',
    titleAr: 'أذكار الحائض والنفساء',
    icon: 'menstruation',
    occasions: [
      {
        id: 'menstruation-guidance',
        categoryId: 'during-menstruation',
        title: 'Permitted remembrances & verified Sunnah note',
        titleAr: 'الأذكار المشروعة والتوضيح الفقهي',
        entries: [getSup('supp-menstruation-1')],
      },
    ],
  },

  // ============================================================================
  // SECTION 3: OCCASIONAL (exact order from specification)
  // ============================================================================
  {
    id: 'deceased',
    section: 'OCCASIONAL',
    title: 'Deceased',
    titleAr: 'الجنائز والميت',
    icon: 'deceased',
    occasions: [
      {
        id: 'deceased-dying',
        categoryId: 'deceased',
        title: 'Near the dying & closing eyes of the deceased',
        titleAr: 'تلقين المحتضر وإغماض الميت',
        entries: fromChapters([52, 54]),
      },
      {
        id: 'deceased-funeral',
        categoryId: 'deceased',
        title: 'Funeral prayer supplications (Janazah)',
        titleAr: 'الدعاء للميت والفرط في الصلاة عليه',
        entries: fromChapters([55, 56]),
      },
      {
        id: 'deceased-condolence',
        categoryId: 'deceased',
        title: 'Words of condolence for the bereaved',
        titleAr: 'دعاء التعزية',
        entries: fromChapters([57]),
      },
      {
        id: 'deceased-burial-graves',
        categoryId: 'deceased',
        title: 'At burial & visiting the graves',
        titleAr: 'الدعاء عند الدفن وزيارة القبور',
        entries: fromChapters([58, 59, 60]),
      },
    ],
  },
  {
    id: 'hajj-umrah',
    section: 'OCCASIONAL',
    title: 'Hajj / Umrah',
    titleAr: 'الحج والعمرة',
    icon: 'hajj',
    occasions: [
      {
        id: 'hajj-talbiyah',
        categoryId: 'hajj-umrah',
        title: 'Talbiyah upon entering Ihram',
        titleAr: 'تلبية المحرم في الحج والعمرة',
        entries: fromChapters([115]),
      },
      {
        id: 'hajj-tawaf',
        categoryId: 'hajj-umrah',
        title: 'During Tawaf around the Ka`bah',
        titleAr: 'أدعية الطواف والركن اليماني',
        entries: fromChapters([116, 117]),
      },
      {
        id: 'hajj-safa-marwah',
        categoryId: 'hajj-umrah',
        title: 'Standing at As-Safa & Al-Marwah',
        titleAr: 'دعاء الوقوف على الصفا والمروة',
        entries: fromChapters([118]),
      },
      {
        id: 'hajj-arafat-mina',
        categoryId: 'hajj-umrah',
        title: 'Day of Arafah, Muzdalifah & Jamarat',
        titleAr: 'عرفة والمشعر الحرام ورمي الجمار',
        entries: fromChapters([119, 120, 121]),
      },
    ],
  },
  {
    id: 'ramadan',
    section: 'OCCASIONAL',
    title: 'Ramadan',
    titleAr: 'رمضان والصيام',
    icon: 'ramadan',
    occasions: [
      {
        id: 'ramadan-crescent',
        categoryId: 'ramadan',
        title: 'Sighting the new crescent moon',
        titleAr: 'دعاء رؤية الهلال',
        entries: fromChapters([67]),
      },
      {
        id: 'ramadan-iftar',
        categoryId: 'ramadan',
        title: 'Breaking the fast (Iftar) & for the host',
        titleAr: 'الدعاء عند إفطار الصائم ولأهل البيت',
        entries: fromChapters([68, 73]),
      },
      {
        id: 'ramadan-laylat-qadr',
        categoryId: 'ramadan',
        title: 'Laylat al-Qadr supplication',
        titleAr: 'دعاء ليلة القدر',
        entries: [getSup('supp-ramadan-qadr')],
      },
      {
        id: 'ramadan-fasting-etiquette',
        categoryId: 'ramadan',
        title: 'When invited to food or insulted while fasting',
        titleAr: 'آداب الصائم إذا دُعي للطعام أو سابه أحد',
        entries: fromChapters([74, 75]),
      },
    ],
  },
  {
    id: 'nature',
    section: 'OCCASIONAL',
    title: 'Nature',
    titleAr: 'الطبيعة والمطر',
    icon: 'nature',
    occasions: [
      {
        id: 'nature-wind-thunder',
        categoryId: 'nature',
        title: 'When the wind blows or it thunders',
        titleAr: 'دعاء الريح والرعد',
        entries: fromChapters([61, 62]),
      },
      {
        id: 'nature-rain',
        categoryId: 'nature',
        title: 'Asking for rain, during rain & after rain',
        titleAr: 'أدعية الاستسقاء ونزول المطر وبعده',
        entries: fromChapters([63, 64, 65, 66]),
      },
      {
        id: 'nature-creatures',
        categoryId: 'nature',
        title: 'Upon hearing a rooster, donkey or dog at night',
        titleAr: 'دعاء صياح الديك ونهيق الحمار ونباح الكلب',
        entries: fromChapters([110, 111]),
      },
    ],
  },
  {
    id: 'good-etiquette',
    section: 'OCCASIONAL',
    title: 'Good Etiquette',
    titleAr: 'الآداب والأخلاق',
    icon: 'etiquette',
    occasions: [
      {
        id: 'etiquette-salam',
        categoryId: 'good-etiquette',
        title: 'Spreading & replying to Salam',
        titleAr: 'إفشاء السلام وردّه',
        entries: fromChapters([108, 109]),
      },
      {
        id: 'etiquette-sneezing',
        categoryId: 'good-etiquette',
        title: 'Sneezing etiquette',
        titleAr: 'دعاء العطاس',
        entries: fromChapters([77, 78]),
      },
      {
        id: 'etiquette-anger-affliction',
        categoryId: 'good-etiquette',
        title: 'When angry or seeing someone afflicted',
        titleAr: 'دعاء الغضب ومن رأى مبتلى',
        entries: fromChapters([82, 83]),
      },
      {
        id: 'etiquette-kindness-praise',
        categoryId: 'good-etiquette',
        title: 'Gratitude, love for Allah & sincere praise',
        titleAr: 'شكر المعروف والمحبة في الله وأدب الثناء',
        entries: fromChapters([87, 89, 90, 93, 94, 112, 113, 114, 132]),
      },
    ],
  },
  {
    id: 'decision-guidance',
    section: 'OCCASIONAL',
    title: 'Decision / Guidance',
    titleAr: 'الاستخارة والهداية',
    icon: 'guidance',
    occasions: [
      {
        id: 'guidance-istikhara',
        categoryId: 'decision-guidance',
        title: 'Salat al-Istikhara (Seeking Allah’s Counsel)',
        titleAr: 'دعاء صلاة الاستخارة',
        entries: fromChapters([26]),
      },
      {
        id: 'guidance-straight-path',
        categoryId: 'decision-guidance',
        title: 'Seeking guidance, uprightness & clarity',
        titleAr: 'طلب الهداية والسداد والصراط المستقيم',
        entries: [
          getSup('supp-guidance-1'),
          getSup('supp-guidance-2'),
          getSup('supp-guidance-3'),
        ],
      },
    ],
  },
];

// Flat index of all entries for lookup by ID (including Hisn + Supplemental)
export const ALL_LIBRARY_DUA_ENTRIES: LibraryDuaEntry[] = (() => {
  const map = new Map<string, LibraryDuaEntry>();
  for (const cat of DUAS_CATEGORIES_LIBRARY) {
    for (const occ of cat.occasions) {
      for (const entry of occ.entries) {
        if (!map.has(entry.id)) {
          map.set(entry.id, entry);
        }
      }
    }
  }
  for (const h of HISN_ITEMS) {
    if (!map.has(h.id)) {
      map.set(h.id, toLibraryEntry(h));
    }
  }
  for (const s of SUPPLEMENTAL_DUAS) {
    if (!map.has(s.id)) {
      map.set(s.id, s);
    }
  }
  return Array.from(map.values());
})();

export function normalizeArabicForSearch(text: string): string {
  return (text || '')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // strip tashkeel/diacritics
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
    .toLowerCase();
}

export function findCategoryAndOccasionForDua(duaId: string): {
  category: DuaCategoryItem;
  occasion: DuaOccasion;
} | null {
  for (const cat of DUAS_CATEGORIES_LIBRARY) {
    for (const occ of cat.occasions) {
      if (occ.entries.some((e) => e.id === duaId)) {
        return { category: cat, occasion: occ };
      }
    }
  }
  return null;
}

export interface LibrarySearchResults {
  categories: DuaCategoryItem[];
  occasions: Array<{ category: DuaCategoryItem; occasion: DuaOccasion }>;
  entries: Array<{
    entry: LibraryDuaEntry;
    category: DuaCategoryItem;
    occasion: DuaOccasion;
  }>;
}

export function searchDuasLibrary(rawQuery: string): LibrarySearchResults {
  const q = rawQuery.trim().toLowerCase();
  const qAr = normalizeArabicForSearch(rawQuery);
  if (!q) return { categories: [], occasions: [], entries: [] };

  const matchedCategories: DuaCategoryItem[] = [];
  const matchedOccasions: Array<{ category: DuaCategoryItem; occasion: DuaOccasion }> = [];
  const matchedEntries: Array<{
    entry: LibraryDuaEntry;
    category: DuaCategoryItem;
    occasion: DuaOccasion;
  }> = [];
  const seenEntryIds = new Set<string>();

  for (const cat of DUAS_CATEGORIES_LIBRARY) {
    if (
      cat.title.toLowerCase().includes(q) ||
      normalizeArabicForSearch(cat.titleAr).includes(qAr)
    ) {
      matchedCategories.push(cat);
    }

    for (const occ of cat.occasions) {
      if (
        occ.title.toLowerCase().includes(q) ||
        normalizeArabicForSearch(occ.titleAr).includes(qAr)
      ) {
        matchedOccasions.push({ category: cat, occasion: occ });
      }

      for (const entry of occ.entries) {
        if (seenEntryIds.has(entry.id)) continue;
        const hit =
          entry.title.toLowerCase().includes(q) ||
          normalizeArabicForSearch(entry.titleAr || '').includes(qAr) ||
          normalizeArabicForSearch(entry.arabic).includes(qAr) ||
          entry.arabic.toLowerCase().includes(q) ||
          entry.translation.toLowerCase().includes(q) ||
          (entry.transliteration && entry.transliteration.toLowerCase().includes(q)) ||
          entry.source.toLowerCase().includes(q);

        if (hit) {
          seenEntryIds.add(entry.id);
          matchedEntries.push({ entry, category: cat, occasion: occ });
        }
      }
    }
  }

  return {
    categories: matchedCategories,
    occasions: matchedOccasions,
    entries: matchedEntries.slice(0, 80),
  };
}
