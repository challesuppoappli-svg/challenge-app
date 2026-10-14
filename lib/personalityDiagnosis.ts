export const PERSONALITY_TYPES = [

  "steady",

  "careful",

  "sprint",

  "explorer",

  "strategist",

  "supportive",

] as const;



export type PersonalityType =

  (typeof PERSONALITY_TYPES)[number];



export type AnswerId = "A" | "B" | "C" | "D";



export type PersonalityOption = {

  id: AnswerId;

  text: string;

  primaryType: PersonalityType;

  secondaryType: PersonalityType;

};



export type PersonalityQuestion = {

  id: number;

  question: string;

  options: PersonalityOption[];

};



export type PersonalityAnswers = Record<

  number,

  AnswerId

>;



export type PersonalityScores = Record<

  PersonalityType,

  number

>;



export type PersonalityPrimaryHits = Record<

  PersonalityType,

  number

>;



export type DiagnosisResult = {

  primaryType: PersonalityType;

  secondaryType: PersonalityType | null;

  scores: PersonalityScores;

  primaryHits: PersonalityPrimaryHits;

  diagnosisVersion: string;

};



export const DIAGNOSIS_VERSION = "1.0.0";



export const PERSONALITY_TYPE_LABELS: Record<

  PersonalityType,

  string

> = {

  steady: "コツコツ努力家",

  careful: "完璧主義慎重派",

  sprint: "瞬間湯沸かし器",

  explorer: "自由な探求家",

  strategist: "陰のプロデューサー",

  supportive: "マイペース調和派",

};



export const PERSONALITY_TYPE_EMOJIS: Record<

  PersonalityType,

  string

> = {

  steady: "🦔",

  careful: "🦉",

  sprint: "🐆",

  explorer: "🦊",

  strategist: "🦅",

  supportive: "🐶",

};



export const PERSONALITY_QUESTIONS: PersonalityQuestion[] = [

  {

    id: 1,

    question:

      "新しいことに挑戦するとき、最初にするのは？",

    options: [

      {

        id: "A",

        text: "まずは少しやってみる。動きながら考えたい",

        primaryType: "sprint",

        secondaryType: "explorer",

      },

      {

        id: "B",

        text: "やり方を調べて、失敗しない準備をしたい",

        primaryType: "careful",

        secondaryType: "steady",

      },

      {

        id: "C",

        text: "ゴールから逆算して、最短ルートを考えたい",

        primaryType: "strategist",

        secondaryType: "careful",

      },

      {

        id: "D",

        text: "面白そうなことから試して、自分に合う方法を探したい",

        primaryType: "explorer",

        secondaryType: "sprint",

      },

    ],

  },

  {

    id: 2,

    question:

      "テスト勉強や資格の勉強、あなたに近いのは？",

    options: [

      {

        id: "A",

        text: "毎日少しずつ進める方が安心する",

        primaryType: "steady",

        secondaryType: "supportive",

      },

      {

        id: "B",

        text: "締め切りが近づくと、一気に集中できる",

        primaryType: "sprint",

        secondaryType: "strategist",

      },

      {

        id: "C",

        text: "目標点を決めて、効率よく勉強したい",

        primaryType: "strategist",

        secondaryType: "steady",

      },

      {

        id: "D",

        text: "興味のある分野から始める。飽きない工夫が大事",

        primaryType: "explorer",

        secondaryType: "sprint",

      },

    ],

  },

  {

    id: 3,

    question:

      "やりたいことがあるのに、なかなか行動できない。なぜ？",

    options: [

      {

        id: "A",

        text: "失敗したくなくて、もっと調べてから始めたい",

        primaryType: "careful",

        secondaryType: "strategist",

      },

      {

        id: "B",

        text: "最初はやる気があるけど、途中で熱が冷めてしまう",

        primaryType: "sprint",

        secondaryType: "explorer",

      },

      {

        id: "C",

        text: "何から始めればいいか分からず、最初の一歩が決まらない",

        primaryType: "steady",

        secondaryType: "strategist",

      },

      {

        id: "D",

        text: "一人でやっていると不安になる。誰かに相談したい",

        primaryType: "supportive",

        secondaryType: "steady",

      },

    ],

  },

  {

    id: 4,

    question:

      "目標を達成するなら、どんな進め方が理想？",

    options: [

      {

        id: "A",

        text: "毎日できる小さな目標を決め、少しずつ積み上げる",

        primaryType: "steady",

        secondaryType: "careful",

      },

      {

        id: "B",

        text: "数字や期限を決めて、成果が出る最短ルートを進む",

        primaryType: "strategist",

        secondaryType: "sprint",

      },

      {

        id: "C",

        text: "ゲームのクエストみたいに、楽しみながら進める",

        primaryType: "explorer",

        secondaryType: "sprint",

      },

      {

        id: "D",

        text: "誰かと励まし合いながら、自分のペースで進める",

        primaryType: "supportive",

        secondaryType: "steady",

      },

    ],

  },

  {

    id: 5,

    question:

      "予定どおりに進まず、失敗してしまったら？",

    options: [

      {

        id: "A",

        text: "原因を分析して、納得できるまで改善策を考える",

        primaryType: "careful",

        secondaryType: "strategist",

      },

      {

        id: "B",

        text: "気持ちを切り替えて、別の方法をすぐに試す",

        primaryType: "explorer",

        secondaryType: "sprint",

      },

      {

        id: "C",

        text: "目標を小さくして、もう一度コツコツやり直す",

        primaryType: "steady",

        secondaryType: "explorer",

      },

      {

        id: "D",

        text: "誰かに話を聞いてもらい、気持ちを整理して再開する",

        primaryType: "supportive",

        secondaryType: "careful",

      },

    ],

  },

  {

    id: 6,

    question:

      "アプリが挑戦をサポートしてくれるなら、何が一番うれしい？",

    options: [

      {

        id: "A",

        text: "今日やることが明確で、小さな成長を実感できる",

        primaryType: "steady",

        secondaryType: "supportive",

      },

      {

        id: "B",

        text: "弱点や改善点を分析して、効率のいい方法を教えてくれる",

        primaryType: "strategist",

        secondaryType: "careful",

      },

      {

        id: "C",

        text: "ゲーム感覚で楽しめて、新しいことにも挑戦できる",

        primaryType: "explorer",

        secondaryType: "sprint",

      },

      {

        id: "D",

        text: "励ましてくれて、つまずいたときも一緒に考えてくれる",

        primaryType: "supportive",

        secondaryType: "steady",

      },

    ],

  },

];



const createEmptyScores = (): PersonalityScores => ({

  steady: 0,

  careful: 0,

  sprint: 0,

  explorer: 0,

  strategist: 0,

  supportive: 0,

});



const createEmptyPrimaryHits =

  (): PersonalityPrimaryHits => ({

    steady: 0,

    careful: 0,

    sprint: 0,

    explorer: 0,

    strategist: 0,

    supportive: 0,

  });



export function calculatePersonalityDiagnosis(

  answers: PersonalityAnswers

): DiagnosisResult | null {

  const hasAnsweredAllQuestions =

    PERSONALITY_QUESTIONS.every(

      (question) => answers[question.id] !== undefined

    );



  if (!hasAnsweredAllQuestions) {

    return null;

  }



  const scores = createEmptyScores();

  const primaryHits = createEmptyPrimaryHits();



  PERSONALITY_QUESTIONS.forEach((question) => {

    const selectedAnswerId = answers[question.id];



    const selectedOption = question.options.find(

      (option) => option.id === selectedAnswerId

    );



    if (!selectedOption) {

      return;

    }



    scores[selectedOption.primaryType] += 2;

    scores[selectedOption.secondaryType] += 1;



    primaryHits[selectedOption.primaryType] += 1;

  });



  const rankedTypes = [...PERSONALITY_TYPES].sort(

    (firstType, secondType) => {

      const scoreDifference =

        scores[secondType] - scores[firstType];



      if (scoreDifference !== 0) {

        return scoreDifference;

      }



      const primaryHitDifference =

        primaryHits[secondType] -

        primaryHits[firstType];



      if (primaryHitDifference !== 0) {

        return primaryHitDifference;

      }



      return (

        PERSONALITY_TYPES.indexOf(firstType) -

        PERSONALITY_TYPES.indexOf(secondType)

      );

    }

  );



  const primaryType = rankedTypes[0];

  const secondPlaceType = rankedTypes[1];



  const scoreDifference =

    scores[primaryType] - scores[secondPlaceType];



  const secondaryType =

    scoreDifference <= 1 ? secondPlaceType : null;



  return {

    primaryType,

    secondaryType,

    scores,

    primaryHits,

    diagnosisVersion: DIAGNOSIS_VERSION,

  };

}