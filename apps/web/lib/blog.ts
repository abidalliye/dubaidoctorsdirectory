import {articleText} from './article-document';
export const blogTopics = [
  "Health Conditions",
  "Symptoms",
  "Treatments",
  "Tests & Diagnostics",
  "Medicines",
  "Procedures",
  "Prevention",
  "Healthy Living",
  "Women’s Health",
  "Men’s Health",
  "Children’s Health",
  "Pregnancy & Fertility",
  "Mental Health",
  "Nutrition & Diet",
  "Fitness & Wellness",
  "Healthcare in Dubai",
];
export type BlogPost = {
  id: string;
  data: Record<string, string>;
  updated_at: string;
};
export const postImage = (p: BlogPost) =>
  p.data.imageId ? `/v1/content/articles/${p.id}/image` : p.data.imageUrl || "";
export const readingTime = (p: BlogPost) =>
  Math.max(1, Math.ceil(articleText(p.data.body||'',p.data.bodyFormat).split(/\s+/).length / 200));
export const coverPosition=(value?:string)=>['center','top','bottom','left','right'].includes(value||'')?value:'center';
