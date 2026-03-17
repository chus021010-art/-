import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Block } from './components/Block';
import { Flower, Sun, Cloud, Info, Camera, CameraOff } from 'lucide-react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera as MPCamera } from '@mediapipe/camera_utils';

type FlowerType = 'red' | 'yellow' | 'blue' | 'white' | 'purple';

interface GardenState {
  [key: string]: FlowerType;
}

export default function App() {
  const GRID_SIZE = 6;
  const [garden, setGarden] = useState<GardenState>({});
  const [selectedFlower, setSelectedFlower] = useState<FlowerType>('red');
  const [showInfo, setShowInfo] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [handPos, setHandPos] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const gardenRef = useRef<HTMLDivElement>(null);
  const lastPinchTime = useRef(0);
  const lastZoomDist = useRef<number | null>(null);

  const flowers: FlowerType[] = ['red', 'yellow', 'blue', 'white', 'purple'];

  const handlePlant = useCallback((x: number, y: number) => {
    const key = `${x},${y}`;
    setGarden(prev => {
      const next = { ...prev };
      if (next[key] === selectedFlower) {
        delete next[key];
      } else {
        next[key] = selectedFlower;
      }
      return next;
    });
  }, [selectedFlower]);

  // Hand Tracking Setup (Updated for 2 hands)
  useEffect(() => {
    if (!isCameraOn || !videoRef.current) return;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: Results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Handle Zoom (2 hands)
        if (results.multiHandLandmarks.length === 2) {
          const h1 = results.multiHandLandmarks[0][8]; // Index tip hand 1
          const h2 = results.multiHandLandmarks[1][8]; // Index tip hand 2
          
          const dist = Math.sqrt(
            Math.pow(h1.x - h2.x, 2) + 
            Math.pow(h1.y - h2.y, 2)
          );

          if (lastZoomDist.current !== null) {
            const delta = dist - lastZoomDist.current;
            setZoomScale(prev => {
              const next = prev + delta * 2; // Sensitivity
              return Math.min(Math.max(next, 0.5), 2.5); // Clamp zoom
            });
          }
          lastZoomDist.current = dist;
          setIsPinching(false); // Disable planting while zooming
        } else {
          // Handle Planting (1 hand)
          lastZoomDist.current = null;
          const landmarks = results.multiHandLandmarks[0];
          const indexTip = landmarks[8];
          const thumbTip = landmarks[4];

          const x = (1 - indexTip.x) * window.innerWidth;
          const y = indexTip.y * window.innerHeight;
          setHandPos({ x, y });

          const distance = Math.sqrt(
            Math.pow(indexTip.x - thumbTip.x, 2) +
            Math.pow(indexTip.y - thumbTip.y, 2) +
            Math.pow(indexTip.z - thumbTip.z, 2)
          );

          const isPinch = distance < 0.05;
          setIsPinching(isPinch);

          if (isPinch && Date.now() - lastPinchTime.current > 500) {
            lastPinchTime.current = Date.now();
            triggerPlantAtPos(x, y);
          }
        }
      } else {
        lastZoomDist.current = null;
        setIsPinching(false);
      }
    });

    const camera = new MPCamera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
  }, [isCameraOn, handlePlant]);

  const triggerPlantAtPos = (screenX: number, screenY: number) => {
    if (!gardenRef.current) return;
    const elements = document.elementsFromPoint(screenX, screenY);
    const block = elements.find(el => el.closest('.cursor-pointer'));
    if (block) {
      (block as HTMLElement).click();
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-[#a29bfe] to-[#6c5ce7] overflow-hidden flex flex-col items-center justify-center disney-container">
      {/* Hand Cursor (Magical) */}
      {isCameraOn && (
        <div 
          className="fixed hand-cursor w-12 h-12 pointer-events-none"
          style={{ left: handPos.x - 24, top: handPos.y - 24 }}
        >
          <div className={`w-full h-full rounded-full border-4 ${isPinching ? 'border-yellow-300 scale-125 bg-yellow-300/40' : 'border-white/60 bg-white/20'} transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.5)]`}>
            {isPinching && <div className="absolute inset-0 rounded-full bg-yellow-300 pinch-indicator" />}
          </div>
        </div>
      )}

      {/* Camera Preview (Glass) */}
      <div className="fixed top-6 right-6 z-30">
        <div className="relative group">
          <video 
            ref={videoRef} 
            className={`camera-preview w-40 h-30 md:w-56 md:h-42 object-cover shadow-2xl transition-all duration-500 ${isCameraOn ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} 
          />
          <button 
            onClick={() => setIsCameraOn(!isCameraOn)}
            className="absolute -bottom-3 -left-3 bg-white/30 backdrop-blur-md text-white p-3 rounded-full border-2 border-white/50 shadow-xl hover:scale-110 transition-transform"
          >
            {isCameraOn ? <CameraOff size={20} /> : <Camera size={20} />}
          </button>
        </div>
      </div>

      {/* Magical Background Elements */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 text-white/30 drop-shadow-2xl"
      >
        <Sun size={140} strokeWidth={1} />
      </motion.div>
      <motion.div 
        animate={{ x: [-20, 20, -20] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 right-32 text-white/20"
      >
        <Cloud size={100} strokeWidth={1} />
      </motion.div>

      {/* Header (Disney Style) */}
      <div className="absolute top-10 text-center z-10">
        <h1 className="text-5xl md:text-7xl text-white drop-shadow-[0_6px_10px_rgba(0,0,0,0.3)] tracking-wide font-disney">
          Magical Garden
        </h1>
        <p className="text-white/90 text-xl mt-3 font-disney tracking-widest">
          {isCameraOn ? '捏合手指，播种魔法' : '开启相机，开始奇妙之旅'}
        </p>
      </div>

      {/* 3D World (Disney Style with Manor Decorations) */}
      <div 
        ref={gardenRef} 
        className="relative disney-world" 
        style={{ 
          width: GRID_SIZE * 75, 
          height: GRID_SIZE * 75,
          transform: `rotateX(45deg) rotateZ(-10deg) scale(${zoomScale})`
        }}
      >
        {/* Manor Fence (Surrounding the grid) */}
        <div className="absolute -inset-10 border-[12px] border-white/40 rounded-[40px] pointer-events-none" style={{ transform: 'translateZ(-20px)' }}>
          {/* Fence Posts */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute w-6 h-16 fence-post rounded-t-full"
              style={{ 
                left: i % 2 === 0 ? `${(i/12)*100}%` : 'auto',
                right: i % 2 !== 0 ? `${((i-1)/12)*100}%` : 'auto',
                top: i < 6 ? '-30px' : 'auto',
                bottom: i >= 6 ? '-30px' : 'auto',
                transform: 'rotateX(-45deg)'
              }}
            />
          ))}
        </div>

        {/* Manor Stone Path (Background) */}
        <div className="absolute -inset-20 bg-white/5 rounded-[60px] -z-10" style={{ transform: 'translateZ(-30px)' }} />

        {Array.from({ length: GRID_SIZE }).map((_, y) =>
          Array.from({ length: GRID_SIZE }).map((_, x) => (
            <Block
              key={`${x}-${y}`}
              x={x}
              y={y}
              onClick={() => handlePlant(x, y)}
              flowerType={garden[`${x},${y}`]}
            />
          ))
        )}
      </div>

      {/* UI Overlay (Glassmorphism) */}
      <div className="absolute bottom-12 flex flex-col items-center gap-8 z-20 w-full px-6">
        {/* Hotbar */}
        <div className="glass-ui p-4 flex gap-4 shadow-2xl">
          {flowers.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedFlower(type)}
              className={`
                w-14 h-14 md:w-20 md:h-20 flex items-center justify-center transition-all duration-300 rounded-2xl
                ${selectedFlower === type ? 'bg-white/40 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-white/10 hover:bg-white/20'}
              `}
            >
              <div className="scale-125">
                <FlowerModelIcon type={type} />
              </div>
            </button>
          ))}
        </div>

        {/* Controls Info */}
        <div className="flex gap-6">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="bg-white/20 backdrop-blur-md text-white p-4 rounded-full border-2 border-white/30 hover:bg-white/40 transition-all shadow-lg"
          >
            <Info size={24} />
          </button>
          <button 
            onClick={() => setGarden({})}
            className="bg-red-400/80 backdrop-blur-md text-white px-8 py-3 rounded-full border-2 border-white/30 hover:bg-red-500/90 font-disney text-xl tracking-widest shadow-lg transition-all"
          >
            重置花园
          </button>
        </div>
      </div>

      {/* Info Modal (Disney Style) */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/40 backdrop-blur-md"
            onClick={() => setShowInfo(false)}
          >
            <div className="bg-white/90 border-4 border-white p-10 rounded-[40px] max-w-lg text-[#6c5ce7] font-disney shadow-[0_20px_50px_rgba(0,0,0,0.3)]" onClick={e => e.stopPropagation()}>
              <h2 className="text-5xl mb-6 text-center tracking-wide">魔法指南</h2>
              <ul className="space-y-6 text-2xl">
                <li className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full border-4 border-[#6c5ce7]" /> 移动食指来控制魔法光标
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-400 shadow-lg" /> 捏合手指即可在土地上播种
                </li>
                <li className="flex items-center gap-4">
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full bg-[#6c5ce7]" />
                    <div className="w-4 h-4 rounded-full bg-[#6c5ce7]" />
                  </div>
                  双手食指张开/缩小即可缩放画面
                </li>
                <li className="flex items-center gap-4">
                  <Camera className="text-[#6c5ce7]" size={32} /> 右上角可以开启奇妙相机
                </li>
              </ul>
              <button 
                onClick={() => setShowInfo(false)}
                className="mt-10 w-full bg-[#6c5ce7] text-white py-4 rounded-full text-2xl hover:bg-[#a29bfe] transition-all shadow-xl tracking-widest"
              >
                开启奇妙之旅
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FlowerModelIcon({ type }: { type: FlowerType }) {
  const colors: Record<FlowerType, string> = {
    red: '#ff7675',
    yellow: '#fdcb6e',
    blue: '#74b9ff',
    white: '#dfe6e9',
    purple: '#a29bfe'
  };
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <div className="absolute w-full h-full rounded-full opacity-80" style={{ background: colors[type] }} />
      <div className="w-3 h-3 bg-yellow-400 rounded-full z-10" />
    </div>
  );
}

function getFlowerColor(type: FlowerType): string {
  const colors: Record<FlowerType, string> = {
    red: '#ff7675',
    yellow: '#fdcb6e',
    blue: '#74b9ff',
    white: '#dfe6e9',
    purple: '#a29bfe'
  };
  return colors[type];
}
