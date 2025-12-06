import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameState, AIResponse } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sceneDescription: {
      type: Type.STRING,
      description: "当前场景的生动描述，营造1988年中国东北、寒冷、悬疑、工业萧条的氛围（中文，简洁有力，不超过3句话）。",
    },
    locationName: {
      type: Type.STRING,
      description: "当前具体地点的名称（例如：'第三轧钢厂大门'，'红星招待所'）。",
    },
    weather: {
      type: Type.STRING,
      description: "当前天气（例如：'鹅毛大雪'，'刺骨寒风'）。",
    },
    nearbyLocations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "玩家可以移动到的2-4个地点列表。",
    },
    characters: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "场景中当前的NPC列表。",
    },
    statsChange: {
      type: Type.OBJECT,
      properties: {
        money: { type: Type.NUMBER },
        hp: { type: Type.NUMBER },
        stamina: { type: Type.NUMBER },
        reputation: { type: Type.NUMBER },
      },
      description: "玩家属性的变化。",
    },
    inventoryAdd: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, description: "物品的外观、用途或隐藏线索的详细描述。" },
          isKeyItem: { type: Type.BOOLEAN, description: "是否为推动剧情的关键证物或重要道具。" }
        },
        required: ["name", "description", "isKeyItem"]
      },
      description: "玩家获得的物品详情。",
    },
    inventoryRemove: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "玩家失去的物品名称。",
    },
    logEntry: {
      type: Type.STRING,
      description: "用于日志显示的简洁行动结果摘要（中文，1句话）。",
    },
    asciiArt: {
      type: Type.STRING,
      description: "代表当前场景的ASCII艺术画。风格必须极简、抽象。仅使用简单线条勾勒轮廓，保留大量留白。不要填充纹理。宽度约50-60字符，高度约15-20行。",
    },
    isSuspense: {
      type: Type.BOOLEAN,
      description: "如果发生了震惊转折、发现尸体或遭遇危机，设为 true。否则 false。",
    },
  },
  required: ["sceneDescription", "locationName", "nearbyLocations", "characters", "logEntry", "asciiArt", "weather", "isSuspense"],
};

export const generateNextTurn = async (
  currentGameState: GameState,
  userAction: string
): Promise<AIResponse> => {
  const model = "gemini-2.5-flash";
  
  const inventoryList = currentGameState.inventory.map(i => i.name).join(", ");

  const prompt = `
    当前状态:
    - 地点: ${currentGameState.locationName}
    - 描述: ${currentGameState.sceneDescription}
    - 物品: ${inventoryList}
    - 状态: 体力 ${currentGameState.stats.hp}, 现金 ${currentGameState.stats.money}
    
    玩家行动: "${userAction}"
    
    任务:
    作为GM推进文字冒险游戏剧情。
    
    背景: 1988年12月，中国东北"桦钢市"。严寒、重工业衰退、连环杀人案。
    主角: 停职刑警/下岗工人。
    谜团: "第三轧钢厂"碎尸案，"红围巾"。
    
    要求:
    1. 中文（简体）回复。
    2. 文笔：冷峻、老电影质感、东北地域特色。
    3. ASCII画：极简风格。只画轮廓，不要画复杂的阴影或纹理。保持画面清晰简单，以加快生成速度。
    4. 不要现代科技。
    5. 回复必须简练，避免长篇大论，减少等待时间。
    6. 如果玩家获得新物品，必须生成详细的描述。如果是重要证物，务必标记 isKeyItem 为 true。
  `;

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: "你是一个硬冷风格的悬疑小说家。描述1988年中国东北。ASCII画必须简单、快速生成。",
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIResponse;
  } catch (error) {
    console.error("AI Generation Error:", error);
    return {
      sceneDescription: "大雪干扰了视线...",
      locationName: currentGameState.locationName,
      weather: currentGameState.weather,
      nearbyLocations: currentGameState.nearbyLocations,
      characters: currentGameState.characters,
      statsChange: {},
      logEntry: "思维暂时中断...",
      isSuspense: false,
      asciiArt: `
      ... 信号丢失 ...
      ... 1988 ...
      ERROR: CONNECTION_LOST
      RETRYING...
      `,
    };
  }
};