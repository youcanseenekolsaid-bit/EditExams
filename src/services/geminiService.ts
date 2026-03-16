import { GoogleGenAI, Type } from "@google/genai";
import { Block } from "../types";

// Initialize the Gemini client lazily to prevent crashes if API key is missing
let ai: GoogleGenAI | null = null;

function getAiClient() {
  if (!ai) {
    let apiKey = localStorage.getItem('gemini_api_key');
    
    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY;
    }
    
    if (!apiKey) {
      throw new Error("لم يتم العثور على مفتاح API. يرجى إضافة مفتاح Gemini API في إعدادات التطبيق.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export function setApiKey(key: string) {
  if (key.trim() === '') {
    localStorage.removeItem('gemini_api_key');
  } else {
    localStorage.setItem('gemini_api_key', key.trim());
  }
  ai = null; // Reset client so it re-initializes with new key
}

export function getApiKey() {
  return localStorage.getItem('gemini_api_key') || process.env.GEMINI_API_KEY || '';
}

async function fetchPdfAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        resolve(base64data);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}

export async function generateWorksheet(
  params: {
    subject: string;
    numQuestions: string;
    elements: string;
    selectedTypes: string[] | 'auto';
    marks: string;
    pages: string;
  },
  onProgress?: (progress: number, status: string) => void,
  signal?: AbortSignal
): Promise<Block[][]> {
  try {
    if (signal?.aborted) throw new Error('تم الإلغاء');
    
    onProgress?.(5, 'جاري قراءة النماذج السابقة...');

    const prompt = `
      أنت معلم رياضيات خبير في تصميم أوراق العمل لطلاب المرحلة الابتدائية.
      قم بإنشاء ورقة عمل باللغة العربية بناءً على المعايير التالية:
      - المادة: ${params.subject === 'math' ? 'الرياضيات' : params.subject}
      - عدد الأسئلة المطلوبة: ${params.numQuestions === 'auto' ? 'تلقائي (اختر العدد الأنسب)' : params.numQuestions}
      - المواضيع المطلوبة: ${params.elements === 'auto' ? 'متنوعة (جمع، طرح، مقارنة، إلخ)' : params.elements}
      - أنواع الأسئلة المطلوبة: ${params.selectedTypes === 'auto' ? 'متنوعة (اختر الأنسب)' : params.selectedTypes.map(t => {
        const typesMap: any = {
          'horizontal': 'عمليات حسابية أفقية',
          'vertical': 'عمليات حسابية عمودية',
          'number_line': 'خط أعداد',
          'shapes': 'أشكال',
          'comparison': 'مقارنة',
          'pattern': 'أنماط',
          'ordering': 'ترتيب',
          'text_to_number': 'كتابة الأعداد (رمز أعداد)',
          'previous_next': 'السابق والتالي'
        };
        return typesMap[t] || t;
      }).join('، ')}
      - الدرجة الكلية للورقة: ${params.marks === 'auto' ? 'غير محددة' : params.marks} (إذا تم تحديد درجة، قم بتوزيعها بشكل منطقي على الأسئلة أو اذكرها في نص السؤال إذا لزم الأمر)
      - عدد الصفحات المطلوبة: ${params.pages === 'auto' ? 'تلقائي (استخدم ذكائك لتحديد متى تنتقل لصفحة جديدة)' : params.pages}
      
      يجب أن تكون الأسئلة مناسبة للأطفال ومكتوبة بلغة عربية واضحة.
      لقد تم تزويدك بملفات PDF لأوراق عمل سابقة كأمثلة. يرجى تحليلها واستخدام نفس أسلوب صياغة الأسئلة وتقنيات الرياضيات الموجودة فيها.
      
      مهم جداً: استخدم تحليلك وذكائك لتوزيع الأسئلة على صفحات متعددة (pages). لا تضع كل الأسئلة في صفحة واحدة إذا كانت ستؤدي إلى ازدحامها. انتقل إلى صفحة جديدة عندما ترى أن الصفحة الحالية امتلأت بناءً على حجم ونوع الأسئلة التي قمت بتوليدها.
      
      هام جداً بخصوص الأرقام: يجب استخدام الأرقام العربية المشرقية (١، ٢، ٣، ٤، ٥، ٦، ٧، ٨، ٩، ٠) في جميع الأرقام والمسائل الحسابية المكتوبة، ولا تستخدم الأرقام الإنجليزية (1, 2, 3).
      
      قم بإرجاع كائن JSON يحتوي على مصفوفة صفحات (pages)، وكل صفحة تحتوي على مصفوفة من الأسئلة (blocks).
      كل كائن سؤال (block) يجب أن يتوافق مع أحد الأنواع التالية:
      
      1. Horizontal Math (عمليات حسابية أفقية):
      { "type": "horizontal_math", "question": "نص السؤال (مثال: أوجد ناتج الجمع)", "equations": [{ "id": "uuid", "num1": "٥", "num2": "٣", "operator": "+", "missingField": "result" }, { "id": "uuid", "num1": "١٠", "num2": "٤", "operator": "-", "missingField": "result" }], "columns": 2 }
      
      2. Vertical Math (عمليات حسابية عمودية):
      { "type": "vertical_math", "question": "نص السؤال (مثال: أوجد ناتج الطرح)", "equations": [{ "id": "uuid", "num1": "١٥", "num2": "٧", "operator": "-" }, { "id": "uuid", "num1": "٢٠", "num2": "١٢", "operator": "-" }] }
      
      3. Comparison (مقارنة):
      { "type": "comparison", "question": "نص السؤال (مثال: ضع علامة > أو < أو =)", "pairs": [{ "id": "uuid", "left": "١٠", "right": "١٥" }, { "id": "uuid", "left": "٢٠", "right": "٢٠" }], "columns": 2 }
      
      4. Pattern (نمط):
      { "type": "pattern", "question": "نص السؤال (مثال: أكمل النمط التالي)", "sequence": ["٢", "٤", "٦", ""] }
      
      5. Text to Number (كتابة الأعداد):
      { "type": "text_to_number", "question": "نص السؤال (مثال: اكتب الأعداد التالية بالأرقام)", "items": [{ "id": "uuid", "text": "خمسة عشر" }, { "id": "uuid", "text": "عشرون" }], "columns": 2 }
      
      6. Previous Next (السابق والتالي):
      { "type": "previous_next", "question": "نص السؤال (مثال: اكتب العدد السابق)", "boxType": "previous", "cells": [{ "id": "uuid", "number": "١٠" }, { "id": "uuid", "number": "١٥" }], "columns": 2 }
      
      7. Ordering Grid (ترتيب الأعداد):
      { "type": "ordering_grid", "question": "نص السؤال (مثال: رتب الأعداد التالية تصاعدياً)", "grids": [{ "id": "uuid", "label": "أعداد", "numbers": "٥, ٢, ٨, ١" }] }
      
      ملاحظات هامة جداً:
      - يجب أن يكون لكل عنصر وداخل كل مصفوفة (مثل equations, pairs, items) معرف فريد (id) عبارة عن نص عشوائي.
      - قم بتوليد عدة عناصر داخل كل سؤال (مثلاً 2 إلى 4 معادلات في السؤال الواحد) لتبدو ورقة العمل غنية.
      - تأكد من ملء جميع الحقول المطلوبة لكل نوع (مثل num1, num2, operator, left, right, text, number, إلخ) بقيم حقيقية مناسبة للسؤال، ولا تتركها فارغة أبداً.
      - تأكد من تنوع الأسئلة إذا كان الخيار "تلقائي".
      - لا تضف أي نصوص خارج مصفوفة الـ JSON.
    `;

    const parts: any[] = [];
    
    // Fetch example PDFs
    const pdfUrls = [
      '/example/الاختبار الشهري الثاني لمادة الرياضيات.pdf',
      '/example/امتحان الفترة الأولى الرياضيات.pdf',
      '/example/نسخة من السؤال الأول أ) أكملي العدد المناسب.pdf',
      '/example/امتحان الفترة الأولى الرياضيات-1.pdf'
    ];
    
    let loadedPdfs = 0;
    for (const url of pdfUrls) {
      if (signal?.aborted) throw new Error('تم الإلغاء');
      const base64 = await fetchPdfAsBase64(url);
      if (base64) {
        parts.push({
          inlineData: {
            data: base64,
            mimeType: 'application/pdf'
          }
        });
      }
      loadedPdfs++;
      onProgress?.(5 + (loadedPdfs / pdfUrls.length) * 15, `جاري قراءة النماذج السابقة (${loadedPdfs}/${pdfUrls.length})...`);
    }
    
    if (signal?.aborted) throw new Error('تم الإلغاء');
    parts.push({ text: prompt });

    onProgress?.(25, 'جاري إرسال الطلب للذكاء الاصطناعي...');

    const generatePromise = async () => {
      const aiClient = getAiClient();
      const responseStream = await aiClient.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    blocks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING },
                          question: { type: Type.STRING },
                          content: { type: Type.STRING },
                          columns: { type: Type.NUMBER },
                          start: { type: Type.NUMBER },
                          end: { type: Type.NUMBER },
                          step: { type: Type.NUMBER },
                          groups: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                shapeType: { type: Type.STRING },
                                count: { type: Type.NUMBER }
                              }
                            }
                          },
                          equation: {
                            type: Type.OBJECT,
                            properties: {
                              num1: { type: Type.STRING },
                              num2: { type: Type.STRING },
                              operator: { type: Type.STRING },
                              result: { type: Type.STRING },
                              missingField: { type: Type.STRING }
                            }
                          },
                          equations: { 
                            type: Type.ARRAY, 
                            items: { 
                              type: Type.OBJECT,
                              properties: {
                                num1: { type: Type.STRING },
                                num2: { type: Type.STRING },
                                operator: { type: Type.STRING },
                                result: { type: Type.STRING },
                                missingField: { type: Type.STRING }
                              }
                            } 
                          },
                          pairs: { 
                            type: Type.ARRAY, 
                            items: { 
                              type: Type.OBJECT,
                              properties: {
                                left: { type: Type.STRING },
                                right: { type: Type.STRING }
                              }
                            } 
                          },
                          sequence: { type: Type.ARRAY, items: { type: Type.STRING } },
                          items: { 
                            type: Type.ARRAY, 
                            items: { 
                              type: Type.OBJECT,
                              properties: {
                                text: { type: Type.STRING }
                              }
                            } 
                          },
                          boxType: { type: Type.STRING },
                          cells: { 
                            type: Type.ARRAY, 
                            items: { 
                              type: Type.OBJECT,
                              properties: {
                                number: { type: Type.STRING }
                              }
                            } 
                          },
                          grids: { 
                            type: Type.ARRAY, 
                            items: { 
                              type: Type.OBJECT,
                              properties: {
                                label: { type: Type.STRING },
                                numbers: { type: Type.STRING }
                              }
                            } 
                          },
                        },
                        required: ["type", "question"]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      let jsonStr = '';
      let chunkCount = 0;
      for await (const chunk of responseStream) {
        if (signal?.aborted) throw new Error('تم الإلغاء');
        jsonStr += chunk.text;
        chunkCount++;
        // Estimate progress: assume around 30 chunks for a typical response
        const estimatedTotalChunks = 30;
        const progressPercent = Math.min(95, 25 + (chunkCount / estimatedTotalChunks) * 70);
        onProgress?.(Math.round(progressPercent), 'جاري توليد الأسئلة...');
      }
      return jsonStr;
    };

    const abortPromise = new Promise<string>((_, reject) => {
      if (signal?.aborted) reject(new Error('تم الإلغاء'));
      signal?.addEventListener('abort', () => reject(new Error('تم الإلغاء')));
    });

    const jsonStr = await Promise.race([generatePromise(), abortPromise]);

    if (signal?.aborted) throw new Error('تم الإلغاء');
    onProgress?.(95, 'جاري تنسيق ورقة العمل...');

    const result = JSON.parse(jsonStr.trim() || '{"pages": []}');
    const pages = result.pages || [];
    
    // Add unique IDs and default properties to all blocks across all pages
    const finalPages = pages.map((page: any) => {
      const blocks = page.blocks || [];
      return blocks.map((block: any) => ({
        ...block,
        id: crypto.randomUUID(),
        marginTop: 0,
        marginBottom: 0,
        scale: 1,
        // Ensure sub-items have IDs if they don't
        equations: block.equations?.map((eq: any) => ({ ...eq, id: eq.id || crypto.randomUUID() })),
        pairs: block.pairs?.map((p: any) => ({ ...p, id: p.id || crypto.randomUUID() })),
        items: block.items?.map((i: any) => ({ ...i, id: i.id || crypto.randomUUID() })),
        cells: block.cells?.map((c: any) => ({ ...c, id: c.id || crypto.randomUUID() })),
        grids: block.grids?.map((g: any) => ({ ...g, id: g.id || crypto.randomUUID() })),
      })) as Block[];
    });

    onProgress?.(100, 'اكتمل الإنشاء!');
    return finalPages;

  } catch (error: any) {
    if (error.message === 'تم الإلغاء') {
      throw error;
    }
    if (error.message.includes('مفتاح API')) {
      throw error;
    }
    console.error("Error generating worksheet:", error);
    throw new Error("حدث خطأ أثناء توليد ورقة العمل. يرجى المحاولة مرة أخرى.");
  }
}
