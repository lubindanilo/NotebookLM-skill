export type SourceType = "url" | "youtube" | "text" | "file" | "drive";

export type OutputType =
  | "audio"
  | "video"
  | "cinematic_video"
  | "slides"
  | "quiz"
  | "flashcards"
  | "mindmap"
  | "infographic"
  | "report"
  | "study_guide"
  | "data_table";

export interface SourceInput {
  id: string;
  type: SourceType;
  value: string;
  title?: string;
  mime_type?: string;
  file_id?: string;
  originalName?: string;
}

export interface OutputConfig {
  output_type: OutputType;
  language: string;
  instructions?: string;
  audio_format?: string;
  audio_length?: string;
  video_format?: string;
  video_style?: string;
  report_format?: string;
  custom_prompt?: string;
  extra_instructions?: string;
  quiz_difficulty?: string;
  quiz_quantity?: string;
  infographic_orientation?: string;
  infographic_detail?: string;
  infographic_style?: string;
  slide_format?: string;
  slide_length?: string;
}

export interface FileInfo {
  filename: string;
  output_type: string;
  size: number;
}

export interface JobStatus {
  job_id: string;
  status: string;
  progress: Record<string, string>;
  files: FileInfo[];
  error?: string;
  elapsed?: number;
}

export interface AuthStatus {
  authenticated: boolean;
  age_days?: number;
  warning?: string;
}

export const OUTPUT_TYPE_META: Record<
  OutputType,
  { label: string; icon: string; description: string }
> = {
  audio: { label: "Podcast", icon: "🎙️", description: "Audio overview" },
  video: { label: "Video", icon: "🎬", description: "Video overview" },
  cinematic_video: { label: "Cinematic", icon: "🎥", description: "Cinematic video (AI Ultra)" },
  slides: { label: "Slides", icon: "📊", description: "Slide deck" },
  quiz: { label: "Quiz", icon: "❓", description: "Multiple choice quiz" },
  flashcards: { label: "Flashcards", icon: "🃏", description: "Study flashcards" },
  mindmap: { label: "Mind Map", icon: "🧠", description: "Visual mind map" },
  infographic: { label: "Infographic", icon: "📈", description: "Visual summary" },
  report: { label: "Report", icon: "📄", description: "Written report" },
  study_guide: { label: "Study Guide", icon: "📚", description: "Learning guide" },
  data_table: { label: "Data Table", icon: "📋", description: "Structured data" },
};

export const OUTPUT_OPTIONS: Record<string, { label: string; options: string[] }[]> = {
  audio: [
    { label: "Format", options: ["deep_dive", "brief", "critique", "debate"] },
    { label: "Length", options: ["short", "default", "long"] },
  ],
  video: [
    { label: "Format", options: ["explainer", "brief"] },
    { label: "Style", options: ["auto_select", "classic", "whiteboard", "kawaii", "anime", "watercolor", "retro_print", "heritage", "paper_craft"] },
  ],
  slides: [
    { label: "Format", options: ["detailed_deck", "presenter_slides"] },
    { label: "Length", options: ["default", "short"] },
  ],
  quiz: [
    { label: "Difficulty", options: ["easy", "medium", "hard"] },
    { label: "Quantity", options: ["fewer", "standard", "more"] },
  ],
  flashcards: [
    { label: "Difficulty", options: ["easy", "medium", "hard"] },
    { label: "Quantity", options: ["fewer", "standard", "more"] },
  ],
  infographic: [
    { label: "Orientation", options: ["landscape", "portrait", "square"] },
    { label: "Detail", options: ["concise", "standard", "detailed"] },
    { label: "Style", options: ["auto_select", "sketch_note", "professional", "bento_grid", "editorial", "instructional", "bricks", "clay", "anime", "kawaii", "scientific"] },
  ],
  report: [
    { label: "Format", options: ["briefing_doc", "study_guide", "blog_post", "custom"] },
  ],
};

// Map option label to the backend field name per output type
export const OPTION_FIELD_MAP: Record<string, Record<string, string>> = {
  audio: { Format: "audio_format", Length: "audio_length" },
  video: { Format: "video_format", Style: "video_style" },
  slides: { Format: "slide_format", Length: "slide_length" },
  quiz: { Difficulty: "quiz_difficulty", Quantity: "quiz_quantity" },
  flashcards: { Difficulty: "quiz_difficulty", Quantity: "quiz_quantity" },
  infographic: { Orientation: "infographic_orientation", Detail: "infographic_detail", Style: "infographic_style" },
  report: { Format: "report_format" },
};
