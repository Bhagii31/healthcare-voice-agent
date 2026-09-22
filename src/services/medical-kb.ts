import { MedicalCondition } from "../types";

export const MEDICAL_KB: MedicalCondition[] = [
  {
    id: "type2-diabetes",
    name: "Type 2 Diabetes",
    overview:
      "A chronic condition where the body struggles to use insulin effectively, causing blood sugar to build up in the bloodstream.",
    facts: [
      {
        question: "What is type 2 diabetes?",
        keywords: ["insulin", "blood sugar", "chronic"],
        answer:
          "Type 2 diabetes means your body struggles to use insulin effectively. Insulin is a hormone that helps control blood sugar. When this happens, sugar builds up in your bloodstream instead of entering your cells for energy. It's different from Type 1 diabetes, which is autoimmune, and usually develops gradually in adults.",
        citations: [{ source: "American Diabetes Association" }, { source: "Mayo Clinic" }],
      },
      {
        question: "What foods should I avoid?",
        keywords: ["sugary drinks", "refined carbohydrates", "processed foods", "fiber"],
        answer:
          "Reduce sugary drinks and foods, refined carbohydrates like white bread and white rice, processed foods high in sodium, and saturated fats. Increase fiber-rich vegetables and fruits, whole grains, lean proteins, and unsaturated fats like olive oil and nuts. Portion control and consistency matter more than perfection.",
        citations: [{ source: "American Diabetes Association" }],
      },
      {
        question: "Can it be reversed?",
        keywords: ["lifestyle", "weight loss", "reverse", "manage"],
        answer:
          "Many people with type 2 diabetes can manage or even put it into remission through lifestyle changes like diet, exercise, and weight loss. A 5-10% weight loss can significantly improve blood sugar control, according to the American Diabetes Association.",
        citations: [{ source: "American Diabetes Association" }, { source: "Mayo Clinic" }],
      },
    ],
  },
  {
    id: "hypertension",
    name: "Hypertension",
    overview: "High blood pressure that puts extra strain on the heart and blood vessels over time.",
    facts: [
      {
        question: "What is hypertension?",
        keywords: ["blood pressure", "arteries", "heart"],
        answer:
          "Hypertension, or high blood pressure, occurs when the force of blood against artery walls is consistently too high. Over time this strains the heart and can damage blood vessels, increasing the risk of heart attack and stroke.",
        citations: [{ source: "American Heart Association" }, { source: "Mayo Clinic" }],
      },
      {
        question: "How is it managed?",
        keywords: ["sodium", "exercise", "monitor", "medication"],
        answer:
          "Management typically includes reducing sodium intake, regular exercise, maintaining a healthy weight, limiting alcohol, and monitoring blood pressure at home. Your doctor may also prescribe medication if lifestyle changes aren't enough.",
        citations: [{ source: "American Heart Association" }],
      },
    ],
  },
  {
    id: "asthma",
    name: "Asthma",
    overview: "A chronic condition in which airways narrow, swell, and produce extra mucus, making breathing difficult.",
    facts: [
      {
        question: "What is asthma?",
        keywords: ["airways", "inflammation", "wheezing"],
        answer:
          "Asthma is a chronic condition where airways become inflamed and narrow, leading to wheezing, shortness of breath, chest tightness, and coughing. Triggers vary by person and can include allergens, exercise, and cold air.",
        citations: [{ source: "American Lung Association" }, { source: "CDC" }],
      },
      {
        question: "How do inhalers work?",
        keywords: ["inhaler", "bronchodilator", "controller"],
        answer:
          "Quick-relief (rescue) inhalers open airways fast during a flare-up. Controller inhalers, taken daily, reduce inflammation over time to prevent flare-ups from happening. Using both correctly, as prescribed, is key to good control.",
        citations: [{ source: "American Lung Association" }],
      },
    ],
  },
  {
    id: "copd",
    name: "COPD",
    overview: "Chronic Obstructive Pulmonary Disease, a progressive lung disease that makes breathing difficult.",
    facts: [
      {
        question: "What is COPD?",
        keywords: ["lungs", "airflow", "progressive"],
        answer:
          "COPD is a group of progressive lung diseases, including emphysema and chronic bronchitis, that block airflow and make breathing difficult. Smoking is the leading cause, though other factors like long-term exposure to irritants also contribute.",
        citations: [{ source: "American Lung Association" }, { source: "CDC" }],
      },
      {
        question: "How can I manage symptoms?",
        keywords: ["quit smoking", "pulmonary rehabilitation", "oxygen"],
        answer:
          "Quitting smoking is the single most effective step. Pulmonary rehabilitation, prescribed medications, staying active within your limits, and avoiding lung irritants can help manage symptoms and slow progression.",
        citations: [{ source: "American Lung Association" }],
      },
    ],
  },
  {
    id: "cad",
    name: "Coronary Artery Disease",
    overview: "A buildup of plaque in the arteries that supply blood to the heart, restricting blood flow.",
    facts: [
      {
        question: "What is coronary artery disease?",
        keywords: ["plaque", "arteries", "blood flow"],
        answer:
          "Coronary artery disease happens when plaque builds up inside the arteries that supply blood to the heart, narrowing them and restricting blood flow. This can lead to chest pain (angina) or a heart attack if a blockage occurs.",
        citations: [{ source: "American Heart Association" }],
      },
      {
        question: "What lifestyle changes help?",
        keywords: ["diet", "exercise", "cholesterol", "smoking"],
        answer:
          "A heart-healthy diet low in saturated fat, regular exercise, not smoking, and managing cholesterol and blood pressure all reduce risk. Your doctor may also recommend medications like statins.",
        citations: [{ source: "American Heart Association" }, { source: "Mayo Clinic" }],
      },
    ],
  },
  {
    id: "anxiety",
    name: "Anxiety",
    overview: "A mental health condition marked by persistent, excessive worry that interferes with daily life.",
    facts: [
      {
        question: "What is an anxiety disorder?",
        keywords: ["worry", "persistent", "mental health"],
        answer:
          "Anxiety disorders involve persistent, excessive worry or fear that's hard to control and interferes with daily activities. Symptoms can include restlessness, rapid heartbeat, trouble concentrating, and sleep problems.",
        citations: [{ source: "National Institute of Mental Health" }],
      },
      {
        question: "What treatments are available?",
        keywords: ["therapy", "cbt", "medication"],
        answer:
          "Common treatments include cognitive behavioral therapy (CBT), other forms of talk therapy, and sometimes medication prescribed by a doctor. Lifestyle steps like exercise, sleep, and stress management also help many people.",
        citations: [{ source: "National Institute of Mental Health" }],
      },
    ],
  },
  {
    id: "depression",
    name: "Depression",
    overview: "A mood disorder causing persistent sadness and loss of interest in activities.",
    facts: [
      {
        question: "What is depression?",
        keywords: ["mood", "sadness", "loss of interest"],
        answer:
          "Depression is a mood disorder causing persistent feelings of sadness and loss of interest in activities you once enjoyed. It can affect sleep, appetite, energy, and concentration, and is treatable.",
        citations: [{ source: "National Institute of Mental Health" }, { source: "Mayo Clinic" }],
      },
      {
        question: "How is depression treated?",
        keywords: ["therapy", "medication", "support"],
        answer:
          "Treatment often combines psychotherapy, such as CBT, with medication like antidepressants when prescribed by a doctor. Support groups, exercise, and consistent sleep routines can also help.",
        citations: [{ source: "National Institute of Mental Health" }],
      },
    ],
  },
  {
    id: "arthritis",
    name: "Arthritis",
    overview: "Inflammation of one or more joints, causing pain and stiffness.",
    facts: [
      {
        question: "What is arthritis?",
        keywords: ["joints", "inflammation", "stiffness"],
        answer:
          "Arthritis refers to inflammation of one or more joints, causing pain, swelling, and stiffness. The two most common types are osteoarthritis, from wear and tear, and rheumatoid arthritis, an autoimmune condition.",
        citations: [{ source: "Arthritis Foundation" }, { source: "CDC" }],
      },
      {
        question: "How can I manage joint pain?",
        keywords: ["exercise", "weight management", "physical therapy"],
        answer:
          "Low-impact exercise, maintaining a healthy weight to reduce joint stress, physical therapy, and, when appropriate, medications can all help manage arthritis pain and preserve mobility.",
        citations: [{ source: "Arthritis Foundation" }],
      },
    ],
  },
  {
    id: "gerd",
    name: "GERD",
    overview: "Gastroesophageal reflux disease, a digestive condition where stomach acid frequently flows back into the esophagus.",
    facts: [
      {
        question: "What is GERD?",
        keywords: ["acid reflux", "esophagus", "stomach"],
        answer:
          "GERD occurs when stomach acid frequently flows back into the esophagus, irritating its lining. Common symptoms include heartburn, regurgitation, and chest discomfort, especially after eating or lying down.",
        citations: [{ source: "American College of Gastroenterology" }, { source: "Mayo Clinic" }],
      },
      {
        question: "What triggers should I avoid?",
        keywords: ["spicy food", "caffeine", "late meals"],
        answer:
          "Common triggers include spicy or fatty foods, caffeine, alcohol, chocolate, and eating large meals close to bedtime. Elevating the head of your bed and not lying down right after eating can also help.",
        citations: [{ source: "American College of Gastroenterology" }],
      },
    ],
  },
  {
    id: "sleep-apnea",
    name: "Sleep Apnea",
    overview: "A disorder where breathing repeatedly stops and starts during sleep.",
    facts: [
      {
        question: "What is sleep apnea?",
        keywords: ["breathing", "sleep", "airway"],
        answer:
          "Sleep apnea is a disorder in which breathing repeatedly stops and starts during sleep, most commonly because throat muscles relax and block the airway (obstructive sleep apnea). It can cause loud snoring and daytime fatigue.",
        citations: [{ source: "American Academy of Sleep Medicine" }, { source: "Mayo Clinic" }],
      },
      {
        question: "How is it treated?",
        keywords: ["cpap", "weight loss", "sleep position"],
        answer:
          "Treatment often includes a CPAP machine to keep airways open during sleep, weight loss if applicable, avoiding alcohol before bed, and sleeping on your side rather than your back.",
        citations: [{ source: "American Academy of Sleep Medicine" }],
      },
    ],
  },
];

export function findCondition(conditionId: string): MedicalCondition | undefined {
  return MEDICAL_KB.find((c) => c.id === conditionId);
}

export function findRelevantFacts(conditionId: string, query: string) {
  const condition = findCondition(conditionId);
  if (!condition) return [];
  const lowerQuery = query.toLowerCase();
  return condition.facts.filter((fact) =>
    fact.keywords.some((kw) => lowerQuery.includes(kw.toLowerCase())) ||
    lowerQuery.includes(fact.question.toLowerCase().slice(0, 10))
  );
}
