
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { WordCloudItem } from '../types';

// 成都公共休闲空间活力影响因素词云
export const GD_JOB_WORD_CLOUD: WordCloudItem[] = [
  { name: '是否节假日', value: 200 }, { name: '舒适度', value: 166 },
  { name: 'POI类型', value: 147 }, { name: '距市中心距离', value: 118 },
  { name: '天气代码', value: 82 }, { name: '是否周末', value: 63 },
  { name: '所在区域', value: 62 }, { name: '社交活跃度', value: 46 },
  { name: '降水量', value: 35 }, { name: '人民公园', value: 95 },
  { name: '浣花溪公园', value: 85 }, { name: '大慈寺', value: 90 },
  { name: '青羊宫', value: 80 }, { name: '天府广场', value: 75 },
  { name: '桂溪生态公园', value: 70 }, { name: '望江楼', value: 65 },
  { name: '黄龙溪古镇', value: 88 }, { name: '锦江区', value: 72 },
  { name: '武侯区', value: 60 }, { name: '春季出游', value: 68 },
  { name: '秋季赏景', value: 55 }, { name: '温度', value: 50 },
  { name: '风速', value: 28 }, { name: '最高温度', value: 45 },
  { name: '公园', value: 58 }, { name: '景区', value: 78 },
  { name: '广场', value: 65 }, { name: '打卡热度', value: 52 },
  { name: '微博签到', value: 40 }, { name: '小红书', value: 48 },
];

interface Props {
  data?: WordCloudItem[];
}

const WordCloud3D: React.FC<Props> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // 使用内置岗位数据，或外部传入数据
  const cloudData = data && data.length > 0 ? data : GD_JOB_WORD_CLOUD;

  const tags = useMemo(() => {
    const phi = Math.PI * (3 - Math.sqrt(5)); // 黄金角
    return cloudData.map((item, i) => {
      const y = 1 - (i / (cloudData.length - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      return { ...item, x, y, z };
    });
  }, [cloudData]);

  useEffect(() => {
    let animationFrameId: number;
    const start = Date.now();

    const animate = () => {
      const delta = Date.now() - start;
      setRotation({
        x: delta * 0.00008,
        y: delta * 0.00016
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const RADIUS = 170;

  // 颜色按照事业单位类别分组
  const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#60a5fa'];

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative flex items-center justify-center overflow-hidden"
      style={{ perspective: '1000px' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.12)_0%,transparent_70%)]" />
      <div className="relative w-full h-full flex items-center justify-center">
        {tags.map((tag, i) => {
          const cosX = Math.cos(rotation.x);
          const sinX = Math.sin(rotation.x);
          const cosY = Math.cos(rotation.y);
          const sinY = Math.sin(rotation.y);

          const x1 = tag.x * cosY - tag.z * sinY;
          const z1 = tag.z * cosY + tag.x * sinY;
          const y1 = tag.y * cosX - z1 * sinX;
          const z2 = z1 * cosX + tag.y * sinX;

          const scale = (z2 + 2) / 3;
          const opacity = Math.max(0.1, (z2 + 1.5) / 2.5);
          const translateX = x1 * RADIUS;
          const translateY = y1 * RADIUS;

          const color = COLORS[i % COLORS.length];
          const maxVal = cloudData[0]?.value ?? 100;
          const fontSize = Math.max(10, Math.round(10 + (tag.value / maxVal) * 14));

          return (
            <div
              key={i}
              className="absolute whitespace-nowrap font-bold cursor-pointer select-none hover:scale-125 hover:z-50 transition-transform duration-100"
              style={{
                transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
                opacity,
                color,
                fontSize: `${fontSize}px`,
                textShadow: `0 0 ${Math.round(8 * scale)}px ${color}`,
                zIndex: Math.floor(z2 * 100)
              }}
              title={`${tag.name}：${tag.value}`}
            >
              {tag.name}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WordCloud3D;
