export interface Questionnaire {
  speakerName: string;
  speakerGender: 'male' | 'female';
  relationshipType: string;
  lostPersonName: string;
  lostPersonGender?: 'male' | 'female';
  customRelationshipText?: string;
  personalConnection: string;
  storyContext: string;
  emotionalImpact: string;
  callToAction: string;
}

export interface ScriptLine {
  text: string;
  durationSeconds: number;
}

export interface GeneratedScript {
  title: string;
  introduction?: string;
  lines: ScriptLine[];
}

export type AppStep = 'PORTAL' | 'QUESTIONNAIRE' | 'GENERATING' | 'SCRIPT_PREVIEW' | 'RECORDING' | 'PLAYER_PREVIEW' | 'BAKING_VIDEO';
