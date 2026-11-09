import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Network, Monitor, Server, Printer, Share2, ShieldAlert, Cpu, 
  HelpCircle, Play, Pause, RotateCcw, CheckCircle, AlertTriangle, 
  Layers, ArrowRight, BookOpen, GraduationCap, Sparkles, Wrench
} from 'lucide-react';
import { ModuleId, DeviceType, NetworkNode, NetworkLink } from './types/network';
import { TOPOLOGIES_DATA, RJ45_T568B_STANDARD } from './data/curriculumData';

export default function LanVirtualLab() {
  // State Management
  const [activeTab, setActiveTab] = useState<ModuleId>('intro');
  const [teacherMode, setTeacherMode] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(20);

  // Simulation Controls
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simLog, setSimLog] = useState<string[]>([]);
  
  // Topology Lab state
  const [selectedTopology, setSelectedTopology] = useState<'star' | 'bus' | 'ring' | 'mesh'>('star');
  const [brokenNodeId, setBrokenNodeId] = useState<string | null>(null);

  // RJ45 Game State
  const [userWireOrder, setUserWireOrder] = useState<number[]>([3, 1, 6, 2, 8, 4, 7, 5]);
  const [isCrimpSuccess, setIsCrimpSuccess] = useState<boolean | null>(null);

  // Sharing Lab State
  const [sharingJob, setSharingJob] = useState<{ step: number; file: string; target: string } | null>(null);

  // Sandbox Nodes & Links
  const [nodes, setNodes] = useState<NetworkNode[]>([
    { id: 'sw1', name: 'Switch قاعة الإعلام', type: 'switch', x: 400, y: 150, ip: '192.168.1.1', mac: '00:1A:3F:01:00', status: 'online' },
    { id: 'pc1', name: 'حاسوب التلميذ 01', type: 'pc', x: 200, y: 320, ip: '192.168.1.11', mac: '00:1A:3F:11:01', status: 'online' },
    { id: 'pc2', name: 'حاسوب التلميذ 02', type: 'pc', x: 400, y: 340, ip: '192.168.1.12', mac: '00:1A:3F:11:02', status: 'online' },
    { id: 'pr1', name: 'طابعة مشتركة', type: 'printer', x: 600, y: 320, ip: '192.168.1.20', mac: '00:1A:3F:22:99', status: 'online' },
    { id: 'srv', name: 'خادم الدروس والموارد', type: 'server', x: 600, y: 120, ip: '192.168.1.2', mac: '00:1A:3F:00:EE', status: 'online' }
  ]);

  const [links, setLinks] = useState<NetworkLink[]>([
    { id: 'l1', from: 'pc1', to: 'sw1', type: 'utp', speedMbps: 100, status: 'active' },
    { id: 'l2', from: 'pc2', to: 'sw1', type: 'utp', speedMbps: 100, status: 'active' },
    { id: 'l3', from: 'pr1', to: 'sw1', type: 'utp', speedMbps: 100, status: 'active' },
    { id: 'l4', from: 'srv', to: 'sw1', type: 'fiber', speedMbps: 1000, status: 'active' }
  ]);

  const [selectedDevice, setSelectedDevice] = useState<NetworkNode | null>(null);

  // Update learner progress based on visited tabs
  const handleTabChange = (id: ModuleId) => {
    setActiveTab(id);
    setProgress(prev => Math.min(100, Math.max(prev, {
      intro: 15, components: 30, topologies: 45, media: 60, sharing: 75, security: 85, sandbox: 95, quiz: 100
    }[id])));
  };

  const addLog = (msg: string) => {
    setSimLog(prev => [`[${new Date().toLocaleTimeString('ar-DZ')}] ${msg}`, ...prev.slice(0, 10)]);
  };

  return (
    <div dir="rtl" className="flex flex-col h-screen w-full bg-[#0a0f1d] text-slate-100 font-sans select-none overflow-hidden">
      
      {/* 1. الشريط العلوي التقني (TopNav) */}
      <header className="h-16 bg-[#0f172e] border-b border-cyan-900/50 px-6 flex items-center justify-between z-30 shadow-lg shadow-cyan-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Network className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-l from-cyan-300 via-blue-200 to-white bg-clip-text text-transparent">
              المختبر الافتراضي للشبكة المحلية LAN
            </h1>
            <p className="text-xs text-cyan-400/80 font-mono">1AS - الإعلام الآلي • المنهاج الجزائري</p>
          </div>
        </div>

        {/* Modules Nav */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#15203b] p-1.5 rounded-xl border border-blue-900/40">
          {[
            { id: 'intro', label: '1. المقدمة', icon: BookOpen },
            { id: 'components', label: '2. المكونات', icon: Cpu },
            { id: 'topologies', label: '3. الطوبولوجيا', icon: Layers },
            { id: 'media', label: '4. وسائط النقل', icon: Share2 },
            { id: 'sharing', label: '5. المشاركة', icon: Printer },
            { id: 'security', label: '6. الأمن والصيانة', icon: ShieldAlert },
            { id: 'sandbox', label: '7. المختبر الحر', icon: Wrench },
            { id: 'quiz', label: '8. التحديات', icon: GraduationCap }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as ModuleId)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Progress & Teacher Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">الإنجاز:</span>
              <span className="text-cyan-400 font-bold font-mono">{progress}%</span>
            </div>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-cyan-900/60">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setTeacherMode(!teacherMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              teacherMode 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/10'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>{teacherMode ? 'وضع الأستاذ مُفعّل' : 'لوحة الأستاذ'}</span>
          </button>
        </div>
      </header>

      {/* Teacher Overlay Bar if active */}
      {teacherMode && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs text-amber-200 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> لوحة التوجيه البيداغوجي للأستاذ:
            </span>
            <span>الهدف التعليمي: إدراك مفهوم الشبكة المحلية LAN، التفريق بين العتاد (Hub vs Switch)، وإتقان الربط ومشاركة الموارد.</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSolution(!showSolution)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold"
            >
              {showSolution ? 'إخفاء الحلول النموذجية' : 'إظهار الحلول النموذجية'}
            </button>
          </div>
        </div>
      )}

      {/* 2. منطقة العمل الرئيسية */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* شاشة العرض الرئيسية حسب الوحدة المختارة */}
        <main className="flex-1 relative flex flex-col bg-[#070b14] overflow-y-auto">

          {/* وحدة 1: المقدمة وقاعة الإعلام الآلي */}
          {activeTab === 'intro' && (
            <ModuleIntro3D onSelectDevice={(dev) => setSelectedDevice(dev)} />
          )}

          {/* وحدة 2: المكونات والمقارنة بين Hub و Switch */}
          {activeTab === 'components' && (
            <ModuleComponentsHubVsSwitch addLog={addLog} showSolution={showSolution} />
          )}

          {/* وحدة 3: الطوبولوجيات */}
          {activeTab === 'topologies' && (
            <ModuleTopologiesLab 
              topology={selectedTopology} 
              setTopology={setSelectedTopology}
              brokenNodeId={brokenNodeId}
              setBrokenNodeId={setBrokenNodeId}
            />
          )}

          {/* وحدة 4: وسائط النقل ولعبة RJ-45 */}
          {activeTab === 'media' && (
            <ModuleMediaAndRJ45 
              userOrder={userWireOrder} 
              setUserOrder={setUserWireOrder}
              isCrimpSuccess={isCrimpSuccess}
              setIsCrimpSuccess={setIsCrimpSuccess}
              showSolution={showSolution}
            />
          )}

          {/* وحدة 5: مشاركة الموارد */}
          {activeTab === 'sharing' && (
            <ModuleResourceSharing 
              sharingJob={sharingJob}
              setSharingJob={setSharingJob}
              addLog={addLog}
            />
          )}

          {/* وحدة 6: الأمن والصيانة */}
          {activeTab === 'security' && (
            <ModuleSecurityTroubleshoot addLog={addLog} />
          )}

          {/* وحدة 7: المختبر الافتراضي المفتوح Sandbox */}
          {activeTab === 'sandbox' && (
            <ModuleSandboxSimulator 
              nodes={nodes}
              setNodes={setNodes}
              links={links}
              setLinks={setLinks}
              isSimulating={isSimulating}
              setIsSimulating={setIsSimulating}
              addLog={addLog}
              onSelectNode={(node) => setSelectedDevice(node)}
            />
          )}

          {/* وحدة 8: التحديات والاختبارات */}
          {activeTab === 'quiz' && (
            <ModuleQuizzesAndChallenges />
          )}
        </main>

        {/* لوحة المعلومات الجانبية المستمرة (Info & Logs Sidebar) */}
        <aside className="w-80 bg-[#0e1629] border-r border-cyan-900/40 flex flex-col p-4 overflow-y-auto shadow-2xl">
          <div className="flex items-center gap-2 pb-3 border-b border-cyan-900/40 text-cyan-300 font-bold text-sm">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>بيانات العنصر المختار</span>
          </div>

          {selectedDevice ? (
            <div className="mt-4 p-4 rounded-xl bg-[#141f36] border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-cyan-400 uppercase font-mono">{selectedDevice.type}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h3 className="text-base font-bold text-white">{selectedDevice.name}</h3>
              <div className="text-xs space-y-1 text-slate-300 font-mono">
                <div>عنوان IP: <span className="text-cyan-300">{selectedDevice.ip}</span></div>
                <div>عنوان MAC: <span className="text-slate-400">{selectedDevice.mac}</span></div>
                <div>الحالة: <span className="text-emerald-400">جاهز ومتصل بالشبكة</span></div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-700/60">
                {selectedDevice.type === 'switch' && 'المبدل Switch يوجه حزم البيانات بدقة نحو المنفذ المربوط بالجهاز الهدف فقط بناءً على جدول عناوين MAC.'}
                {selectedDevice.type === 'hub' && 'الموزع Hub يكرر الإشارة ويرسلها لكل الأجهزة دفعة واحدة مسبباً ضغطاً وتصادماً.'}
                {selectedDevice.type === 'printer' && 'طابعة مشتركة يمكن لأي تلميذ في القاعة إرسال مهام الطباعة إليها مباشرة دون نقل الملفات بقرص فلاش.'}
                {selectedDevice.type === 'server' && 'خادم القاعة: يخزن الدروس، الفروض، وملفات التلاميذ المشتركة مع نظام إدارة الصلاحيات.'}
                {selectedDevice.type === 'pc' && 'محطة عمل مزودة ببطاقة شبكة NIC للتواصل وتبادل المعطيات محلياً.'}
              </p>
            </div>
          ) : (
            <div className="mt-4 p-6 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-400">
              انقر على أي جهاز داخل القاعة أو المختبر لاستعراض تفاصيله وعنوانه الفيزيائي والمنطقي.
            </div>
          )}

          {/* سجل أحداث الشبكة الحقيقي */}
          <div className="mt-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 text-xs font-bold text-slate-300">
              <span>سجل الحزم والبيانات:</span>
              <span className="text-[10px] text-cyan-400 font-mono">LAN Traffic</span>
            </div>
            <div className="flex-1 bg-[#090d19] rounded-lg p-2.5 font-mono text-[11px] space-y-1.5 overflow-y-auto border border-cyan-950 max-h-48">
              {simLog.length === 0 ? (
                <div className="text-slate-500 text-center py-4">لا توجد حزم مرسلة حالياً...</div>
              ) : (
                simLog.map((log, i) => (
                  <div key={i} className="text-cyan-300/90 leading-tight border-b border-slate-800/50 pb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* العلاقة الوظيفية: مدخلات -> معالجة -> مخرجات */}
          <div className="mt-4 pt-3 border-t border-cyan-900/40">
            <div className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>العلاقة الوظيفية لمشروع الشبكة</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
              <div className="bg-blue-950/60 p-1.5 rounded border border-blue-800/40 text-blue-200">
                <span className="font-bold block text-blue-400">1. مدخلات</span>
                أجهزة + وثائق + طلبات طباعة
              </div>
              <div className="bg-cyan-950/60 p-1.5 rounded border border-cyan-800/40 text-cyan-200">
                <span className="font-bold block text-cyan-400">2. معالجة</span>
                توجيه الحزم وتشفير الإشارة
              </div>
              <div className="bg-emerald-950/60 p-1.5 rounded border border-emerald-800/40 text-emerald-200">
                <span className="font-bold block text-emerald-400">3. مخرجات</span>
                طباعة أوراق وتبادل فوري
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

// =========================================================================
// 3. مكونات الوحدات التعليمية (Sub-Components)
// =========================================================================

/** الوحدة 1: مشهد ثلاثي الأبعاد تفاعلي لقاعة المعلوماتية المدرسية */
function ModuleIntro3D({ onSelectDevice }: { onSelectDevice: (d: any) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const width = mountRef.current?.clientWidth || 800;
    const height = mountRef.current?.clientHeight || 500;

    // مشهد Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080e1a);

    // شبكة الأرضية التقنية
    const gridHelper = new THREE.GridHelper(30, 30, 0x00e5ff, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 10, 16);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountRef.current?.appendChild(renderer.domElement);

    // إضاءة متوازنة
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00e5ff, 1.2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // بناء مجسمات الحواسيب والخادم والطابعة برمجياً دون الحاجة لملفات خارجية ثقيلة
    const group = new THREE.Group();

    // 1. خزانة Switch والموزع المركزي
    const rackGeo = new THREE.BoxGeometry(2, 4, 1.5);
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const rack = new THREE.Mesh(rackGeo, rackMat);
    rack.position.set(0, 2, -4);
    group.add(rack);

    // أضواء LED على الخزانة تومض
    const ledGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    for (let i = 0; i < 6; i++) {
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(-0.6 + i * 0.25, 3.2, -3.2);
      group.add(led);
    }

    // 2. مصفوفة حواسيب التلاميذ
    const pcGeo = new THREE.BoxGeometry(1.2, 0.8, 0.2);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
    const baseGeo = new THREE.BoxGeometry(0.6, 0.1, 0.4);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155 });

    const pcPositions = [
      { x: -5, z: 2 }, { x: -2, z: 2 }, { x: 2, z: 2 }, { x: 5, z: 2 },
      { x: -5, z: 6 }, { x: -2, z: 6 }, { x: 2, z: 6 }, { x: 5, z: 6 }
    ];

    pcPositions.forEach((pos, idx) => {
      const pcMesh = new THREE.Mesh(pcGeo, screenMat);
      pcMesh.position.set(pos.x, 1.2, pos.z);
      
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.set(pos.x, 0.75, pos.z);

      group.add(pcMesh);
      group.add(baseMesh);

      // كابل الربط الأزرق يتجه نحو خزانة Switch في الخلف
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(pos.x, 0.05, pos.z),
        new THREE.Vector3(pos.x * 0.5, 0.05, 0),
        new THREE.Vector3(0, 0.05, -4)
      );
      const points = curve.getPoints(20);
      const cableGeo = new THREE.BufferGeometry().setFromPoints(points);
      const cableMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
      const cable = new THREE.Line(cableGeo, cableMat);
      group.add(cable);
    });

    scene.add(group);

    // حلقة التصيير والتدوير الخفيف
    let animationFrameId: number;
    const animate = () => {
      group.rotation.y += 0.0015;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mountRef.current) mountRef.current.innerHTML = '';
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Monitor className="text-cyan-400 w-6 h-6" />
            الوحدة الأولى: اكتشف الشبكة المحلية (Local Area Network - LAN)
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            الشبكة المحلية هي مجموعة من أجهزة الإعلام الآلي المترابطة داخل نطاق جغرافي محدود (قاعة الدرس، ثانوية، مخبر)، بهدف تبادل المعطيات ومشاركة الموارد.
          </p>
        </div>
        <div className="bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs text-cyan-300 font-mono">
          نموذج 3D: قاعة الإعلام الآلي النموذجية (16 حاسوب + موزع + طابعة)
        </div>
      </div>

      <div className="flex-1 relative rounded-2xl overflow-hidden border border-cyan-900/60 shadow-2xl bg-[#030712] min-h-[420px]" ref={mountRef}>
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700/60 text-xs space-y-1.5 max-w-xs pointer-events-none">
          <span className="font-bold text-cyan-300 block">تعليمات الاستكشاف:</span>
          <p className="text-slate-300">
            • المشهد يدور تلقائياً لإبراز الكابلات الممتدة من الحواسيب إلى خزانة التوزيع المركزية.
          </p>
          <p className="text-slate-300">
            • لاحظ أن جميع الأجهزة تشترك في كابلات تتجمع في نقطة موحدة (طوبولوجيا نجمية Star).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-cyan-900/40">
          <h4 className="text-sm font-bold text-cyan-300 mb-1">لماذا ننشئ LAN في الثانوية؟</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            بدلاً من تزويد كل تلميذ بطابعة أو شراء وسائط تخزين فلاش متعددة، تسمح الشبكة بالطباعة المركزية، الوصول لفروض الأستاذ، وإجراء التمارين التفاعلية.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-cyan-900/40">
          <h4 className="text-sm font-bold text-cyan-300 mb-1">المجال الجغرافي للشبكة</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            يقتصر امتداد LAN على مبنى واحد أو حجرة دراسية (من أمتار قليلة إلى بضع مئات الأمتار)، وتتميز بسرعات نقل فائقة (100Mbps إلى 10Gbps).
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-cyan-900/40">
          <h4 className="text-sm font-bold text-cyan-300 mb-1">العلاقة (عتاد + برمجيات)</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            الشبكة ليست مجرد كابلات وأجهزة؛ بل تتطلب بروتوكولات اتصال (مثل TCP/IP) وأنظمة تشغيل تدعم مشاركة الملفات والصلاحيات.
          </p>
        </div>
      </div>
    </div>
  );
}

/** الوحدة 2: مقارنة تفاعلية حية بين Hub و Switch مع محاكاة البث والازدحام */
function ModuleComponentsHubVsSwitch({ addLog, showSolution }: { addLog: (m: string) => void; showSolution: boolean }) {
  const [deviceType, setDeviceType] = useState<'hub' | 'switch'>('switch');
  const [sendingState, setSendingState] = useState<boolean>(false);
  const [destinationPC, setDestinationPC] = useState<number>(3);

  const triggerPacket = (dest: number) => {
    setDestinationPC(dest);
    setSendingState(true);
    addLog(`إرسال حزمة بيانات من الحاسوب 1 نحو الحاسوب ${dest} عبر جهاز: [${deviceType.toUpperCase()}]`);

    setTimeout(() => {
      setSendingState(false);
      if (deviceType === 'hub') {
        addLog(`⚠️ [Hub Broadcast]: انتشرت الإشارة لجميع المنافذ! الحاسوب ${dest} استلمها، ورفضها الباقون.`);
      } else {
        addLog(`✅ [Switch Unicast]: تم توجيه الإطار حصرياً إلى المنفذ المقابل للماك MAC الخاص بالحاسوب ${dest}.`);
      }
    }, 2400);
  };

  return (
    <div className="flex-1 p-6 flex flex-col space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="text-cyan-400 w-6 h-6" />
            الوحدة الثانية: عتاد الربط الشبكي (Hub مقابل Switch)
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            قارن عملياً كيف يتصرف الموزع القديم (Hub) مقارنة بالمبدل الذكي (Switch) أثناء إرسال البيانات.
          </p>
        </div>

        {/* Toggle between Hub and Switch */}
        <div className="bg-[#121c33] p-1.5 rounded-xl border border-cyan-800/60 flex gap-2">
          <button
            onClick={() => setDeviceType('switch')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              deviceType === 'switch' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30' : 'text-slate-300'
            }`}
          >
            جهاز المبدل: Switch (ذكي)
          </button>
          <button
            onClick={() => setDeviceType('hub')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              deviceType === 'hub' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' : 'text-slate-300'
            }`}
          >
            جهاز الموزع: Hub (بث عام)
          </button>
        </div>
      </div>

      {/* لوحة المحاكاة البصرية */}
      <div className="flex-1 bg-[#090e1c] rounded-2xl border border-cyan-900/50 p-6 flex flex-col items-center justify-center relative min-h-[380px]">
        
        {/* جهاز الربط المركزي في المنتصف */}
        <div className={`p-6 rounded-2xl border-2 flex flex-col items-center transition-all ${
          deviceType === 'switch' 
            ? 'bg-cyan-950/60 border-cyan-400 shadow-2xl shadow-cyan-500/20' 
            : 'bg-amber-950/60 border-amber-400 shadow-2xl shadow-amber-500/20'
        }`}>
          <div className="text-xs uppercase font-mono text-cyan-300 tracking-wider">الجهاز المركزي للشبكة</div>
          <div className="text-2xl font-black text-white mt-1">
            {deviceType === 'switch' ? 'Switch (Commutateur)' : 'Hub (Concentrateur)'}
          </div>
          <div className="text-[11px] text-slate-300 mt-1 font-mono">
            {deviceType === 'switch' ? 'يعتمد على جدول عناوين MAC للتوجيه' : 'يكرر الإشارة على كافة المنافذ (Multiport Repeater)'}
          </div>

          <div className="flex gap-2 mt-3">
            {[1, 2, 3, 4].map(port => (
              <div key={port} className="w-4 h-4 rounded bg-slate-900 border border-slate-600 flex items-center justify-center text-[8px] font-mono">
                {port}
              </div>
            ))}
          </div>
        </div>

        {/* الحواسيب المرتبطة أسفل الجهاز المركزي */}
        <div className="w-full max-w-3xl flex justify-between mt-20 relative">
          
          {/* حاسوب المصدر المرسل دائماً PC1 */}
          <div className="flex flex-col items-center">
            <div className="p-4 bg-blue-900/40 rounded-xl border border-blue-400 text-center relative shadow-lg">
              <Monitor className="w-8 h-8 text-blue-300 mx-auto" />
              <div className="text-xs font-bold text-white mt-1">حاسوب A (المرسل)</div>
              <div className="text-[10px] text-blue-300 font-mono">IP: 192.168.1.10</div>
            </div>
          </div>

          {/* الحواسيب المستقبلة المحتملة */}
          {[2, 3, 4].map(num => (
            <div key={num} className="flex flex-col items-center">
              <div className={`p-4 rounded-xl border text-center relative transition-all ${
                destinationPC === num 
                  ? 'bg-emerald-950/60 border-emerald-400 shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-900/60 border-slate-700'
              }`}>
                <Monitor className={`w-8 h-8 mx-auto ${destinationPC === num ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div className="text-xs font-bold text-white mt-1">حاسوب {num}</div>
                <div className="text-[10px] text-slate-400 font-mono">192.168.1.{10 + num}</div>
                
                <button
                  disabled={sendingState}
                  onClick={() => triggerPacket(num)}
                  className="mt-2 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-[10px] text-white font-bold rounded"
                >
                  أرسل إليه الآن
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* مسار الحزمة المتحركة التوضيحية */}
        {sendingState && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center animate-bounce">
            <span className="px-3 py-1 rounded-full bg-cyan-400 text-slate-950 text-xs font-black shadow-lg">
              {deviceType === 'switch' ? 'حزمة موجهة فردياً Unicast ➔' : 'بث عام لكافة المنافذ Broadcast ⚡'}
            </span>
          </div>
        )}
      </div>

      {/* مقارنة جدولية تفصيلية متوافقة مع منهاج 1 ثانوي */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#0f182c] border border-cyan-800/40">
          <h4 className="text-sm font-bold text-cyan-300 mb-2">مميزات المبدل Switch:</h4>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
            <li>يقوم بتوجيه الإطارات (Frames) بالاعتماد على العنوان الفيزيائي MAC للجهاز الهدف.</li>
            <li>يقسم الشبكة إلى نطاقات تصادم مستقلة (Collision Domains)، مما يلغي بطء الشبكة.</li>
            <li>يسمح بالاتصال المزدوج الكامل (Full Duplex) أي الإرسال والاستقبال في اللحظة نفسها.</li>
          </ul>
        </div>
        <div className="p-4 rounded-xl bg-[#0f182c] border border-amber-800/40">
          <h4 className="text-sm font-bold text-amber-300 mb-2">سلبيات الموزع القديم Hub:</h4>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
            <li>جهاز غبي فيزيائي (طبقة 1)، لا يقرأ العناوين بل يرسل البيانات لكل الحواسيب دون استثناء.</li>
            <li>يسبب تصادم الإشارات (Collisions) وازدحام الكابلات، مما يؤدي لضعف الأمان والخصوصية.</li>
            <li>يعمل بنصف ازدواج (Half Duplex)، أي جهاز واحد فقط يمكنه الإرسال في اللحظة الواحدة.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/** الوحدة 3: مختبر الطوبولوجيا تفاعلي لاختبار الأعطال ومسار البيانات */
function ModuleTopologiesLab({ 
  topology, setTopology, brokenNodeId, setBrokenNodeId 
}: { 
  topology: 'star' | 'bus' | 'ring' | 'mesh';
  setTopology: (t: any) => void;
  brokenNodeId: string | null;
  setBrokenNodeId: (id: string | null) => void;
}) {
  const current = TOPOLOGIES_DATA[topology];

  const handleToggleFail = (id: string) => {
    setBrokenNodeId(brokenNodeId === id ? null : id);
  };

  return (
    <div className="flex-1 p-6 flex flex-col space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="text-cyan-400 w-6 h-6" />
            الوحدة الثالثة: طوبولوجيا وبنية الشبكات (Topologies)
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            تعرف على الطرق الهندسية لربط الحواسيب واختبر تأثير تعطل جهاز أو كابل رئيسي على استمرار الشبكة.
          </p>
        </div>

        {/* اختيار الطوبولوجيا */}
        <div className="bg-[#121c33] p-1 rounded-xl border border-cyan-800/60 flex gap-1">
          {(['star', 'bus', 'ring', 'mesh'] as const).map(topo => (
            <button
              key={topo}
              onClick={() => { setTopology(topo); setBrokenNodeId(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                topology === topo ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              {topo === 'star' && 'النجمية (Star)'}
              {topo === 'bus' && 'الخطية (Bus)'}
              {topo === 'ring' && 'الحلقية (Ring)'}
              {topo === 'mesh' && 'الشبكية (Mesh)'}
            </button>
          ))}
        </div>
      </div>

      {/* مساحة تفاعلية لرسم الطوبولوجيا الحالية */}
      <div className="flex-1 bg-[#080d19] rounded-2xl border border-cyan-900/50 p-6 relative flex flex-col items-center justify-center min-h-[360px]">
        
        {/* تعليمات محاكاة العطل */}
        <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-700 p-2.5 rounded-xl text-xs space-y-1">
          <span className="text-amber-400 font-bold block">تجربة المحاكاة البيداغوجية:</span>
          <span className="text-slate-300">انقر على أي جهاز أو سلك لافتعال عطل وملاحظة النتيجة.</span>
        </div>

        {/* رسم الطوبولوجيا النجمية */}
        {topology === 'star' && (
          <div className="relative w-96 h-72 flex items-center justify-center">
            {/* الجهاز المركزي Switch */}
            <div 
              onClick={() => handleToggleFail('central')}
              className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all z-10 ${
                brokenNodeId === 'central'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-xl shadow-rose-500/20'
                  : 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-xl shadow-cyan-500/20'
              }`}
            >
              <Cpu className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">Switch</span>
              <span className="text-[9px] font-mono">{brokenNodeId === 'central' ? 'معطل!' : 'شغال'}</span>
            </div>

            {/* الحواسيب المحيطية 4 */}
            {[-45, 45, 135, 225].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x = Math.cos(rad) * 130;
              const y = Math.sin(rad) * 100;
              const isFailed = brokenNodeId === `pc_${i}` || brokenNodeId === 'central';
              return (
                <div key={i} style={{ transform: `translate(${x}px, ${y}px)` }} className="absolute z-10">
                  <div 
                    onClick={() => handleToggleFail(`pc_${i}`)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center cursor-pointer transition-all ${
                      isFailed 
                        ? 'bg-rose-900/40 border-rose-500 text-rose-300' 
                        : 'bg-slate-900/90 border-slate-600 text-slate-200 hover:border-cyan-400'
                    }`}
                  >
                    <Monitor className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-bold">حاسوب {i + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* رسم الطوبولوجيا الخطية */}
        {topology === 'bus' && (
          <div className="relative w-full max-w-xl flex flex-col items-center justify-center py-12">
            {/* الكابل المحوري المركزي مع Terminators في الأطراف */}
            <div 
              onClick={() => handleToggleFail('bus_cable')}
              className={`w-full h-3 rounded-full cursor-pointer transition-all relative ${
                brokenNodeId === 'bus_cable' ? 'bg-rose-600 shadow-lg shadow-rose-600/40' : 'bg-cyan-400 shadow-lg shadow-cyan-400/40'
              }`}
            >
              <div className="absolute -right-3 -top-2 w-4 h-7 bg-amber-400 rounded-sm flex items-center justify-center text-[7px] text-slate-950 font-bold">T</div>
              <div className="absolute -left-3 -top-2 w-4 h-7 bg-amber-400 rounded-sm flex items-center justify-center text-[7px] text-slate-950 font-bold">T</div>
            </div>

            <div className="w-full flex justify-around mt-8">
              {[1, 2, 3, 4].map((num) => {
                const isDown = brokenNodeId === 'bus_cable';
                return (
                  <div key={num} className="flex flex-col items-center">
                    <div className="w-0.5 h-6 bg-slate-500 mb-1" />
                    <div className={`p-2.5 rounded-xl border text-center transition-all ${
                      isDown ? 'bg-rose-950/60 border-rose-500 text-rose-300' : 'bg-slate-900 border-slate-700 text-white'
                    }`}>
                      <Monitor className="w-5 h-5 mx-auto" />
                      <span className="text-[10px] block mt-1">حاسوب {num}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* رسم الطوبولوجيا الحلقية */}
        {topology === 'ring' && (
          <div className="relative w-64 h-64 border-2 border-dashed border-cyan-500/50 rounded-full flex items-center justify-center">
            {[0, 90, 180, 270].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = Math.cos(rad) * 110;
              const y = Math.sin(rad) * 110;
              const isFailed = brokenNodeId === `ring_${i}`;
              return (
                <div 
                  key={i} 
                  style={{ transform: `translate(${x}px, ${y}px)` }} 
                  onClick={() => handleToggleFail(`ring_${i}`)}
                  className={`absolute p-2.5 rounded-xl border cursor-pointer ${
                    isFailed ? 'bg-rose-900/60 border-rose-500 text-rose-300' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  <span className="text-[9px] block">عقدة {i + 1}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* رسم الطوبولوجيا الشبكية Mesh */}
        {topology === 'mesh' && (
          <div className="p-4 text-center">
            <div className="text-cyan-300 font-bold mb-2 text-sm">كل عقدة متصلة بالعقد الأخرى بمسار مستقل:</div>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="p-3 bg-slate-900 border border-cyan-500/60 rounded-xl text-white">
                  <Monitor className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                  <span className="text-xs">محطة {n}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* تشخيص العطل الناتج فورياً */}
        <div className="mt-4 text-xs font-mono px-4 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-center">
          {brokenNodeId ? (
            <span className="text-rose-400 font-bold">
              تنبيه: {brokenNodeId === 'central' ? 'تعطل Switch شل الشبكة كاملة!' : brokenNodeId === 'bus_cable' ? 'انقطاع الكابل الرئيسي عطل كافة المحطات!' : 'عطل محطة طرفية؛ باقي الشبكة يعمل بسلاسة.'}
            </span>
          ) : (
            <span className="text-emerald-400">الشبكة تعمل بكفاءة تامة دون أخطاء أو انقطاع.</span>
          )}
        </div>
      </div>

      {/* بطاقة معلومات الطوبولوجيا */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-cyan-900/50 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-cyan-400 font-bold block mb-1">التعريف والانتشار:</span>
          <p className="text-slate-300 leading-relaxed">{current.descAr}</p>
        </div>
        <div>
          <span className="text-emerald-400 font-bold block mb-1">المزايا:</span>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            {current.advantages.map((adv, i) => <li key={i}>{adv}</li>)}
          </ul>
        </div>
        <div>
          <span className="text-rose-400 font-bold block mb-1">العيوب والموثوقية:</span>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            {current.disadvantages.map((dis, i) => <li key={i}>{dis}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** الوحدة 4: وسائط النقل ولعبة ترتيب أسلاك كابل RJ-45 حسب معيار T568B */
function ModuleMediaAndRJ45({ 
  userOrder, setUserOrder, isCrimpSuccess, setIsCrimpSuccess, showSolution 
}: {
  userOrder: number[];
  setUserOrder: (o: number[]) => void;
  isCrimpSuccess: boolean | null;
  setIsCrimpSuccess: (s: boolean | null) => void;
  showSolution: boolean;
}) {
  const moveWire = (fromIdx: number, toIdx: number) => {
    const updated = [...userOrder];
    const item = updated.splice(fromIdx, 1)[0];
    updated.splice(toIdx, 0, item);
    setUserOrder(updated);
    setIsCrimpSuccess(null);
  };

  const verifyCrimping = () => {
    // التحقق من المطابقة مع المعيار T568B (1,2,3,4,5,6,7,8)
    const isCorrect = userOrder.every((val, idx) => val === idx + 1);
    setIsCrimpSuccess(isCorrect);
  };

  return (
    <div className="flex-1 p-6 flex flex-col space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Share2 className="text-cyan-400 w-6 h-6" />
            الوحدة الرابعة: وسائط النقل وتأريج الموصل RJ-45
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            قارن بين كابل الزوج المجدول (Twisted Pair) والألياف البصرية (Fiber Optic)، ثم قم بترتيب الأسلاك داخل موصل RJ45 وفق معيار T568B.
          </p>
        </div>
      </div>

      {/* معرض وسائط النقل */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-cyan-800/40 space-y-2">
          <div className="text-cyan-400 font-bold text-sm">1. الكابل المزدوج الملتوي (UTP/STP)</div>
          <p className="text-xs text-slate-300 leading-relaxed">
            يتكون من 8 أسلاك نحاسية ملفوفة في 4 أزواج لتقليل التشويش الكهرومغناطيسي، ينتهي بموصل RJ45 ويصل لمدى 100 متر بسرعة 1Gbps.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-cyan-800/40 space-y-2">
          <div className="text-cyan-400 font-bold text-sm">2. كابل الألياف البصرية (Fiber Optic)</div>
          <p className="text-xs text-slate-300 leading-relaxed">
            ينقل البيانات بواسطة نبضات ضوئية عبر خيوط زجاجية نقية، فائق السرعة، منيع تماماً ضد التشويش ويغطي مسافات شاسعة بالكيلومترات.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-cyan-800/40 space-y-2">
          <div className="text-cyan-400 font-bold text-sm">3. كابل محوري (Coaxial Cable)</div>
          <p className="text-xs text-slate-300 leading-relaxed">
            استخدم قديماً في الطوبولوجيا الخطية (مع وصلات BNC)، ذو ناقل نحاسي محاط بعازل وشبكة حماية أرضية.
          </p>
        </div>
      </div>

      {/* اللعبة التفاعلية: تأريج الكابل RJ-45 */}
      <div className="flex-1 bg-[#090e1c] rounded-2xl border border-cyan-900/60 p-6 flex flex-col items-center justify-between">
        <div className="text-center">
          <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            ورشة التأريج العملية: رتب ألوان الأسلاك الثمانية وفق معيار T-568B
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            استخدم الأسهم لتحريك كل سلك يساراً أو يميناً حتى تحصل على الترتيب القياسي من السن 1 إلى السن 8.
          </p>
        </div>

        {/* محاكاة رأس الموصل الشفاف RJ45 */}
        <div className="w-full max-w-2xl bg-slate-900/90 border-2 border-cyan-400/80 rounded-2xl p-6 shadow-2xl relative">
          <div className="text-[10px] text-cyan-300 font-mono text-center mb-3">رأس الموصل الشفاف RJ-45 (دبابيس التوصيل 1 - 8)</div>

          <div className="grid grid-cols-8 gap-2">
            {userOrder.map((pinNum, idx) => {
              const wire = RJ45_T568B_STANDARD[pinNum - 1];
              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">سن {idx + 1}</span>
                  
                  {/* مجسم السلك اللوني */}
                  <div 
                    style={{ backgroundColor: wire.color }}
                    className={`w-8 h-28 rounded-md flex items-center justify-center shadow-lg relative border ${
                      wire.stripe ? 'border-dashed border-white' : 'border-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-bold text-white bg-slate-950/70 px-1 rounded transform -rotate-90">
                      {wire.name}
                    </span>
                  </div>

                  {/* أزرار الإزاحة */}
                  <div className="flex gap-1 mt-1">
                    <button 
                      disabled={idx === 0} 
                      onClick={() => moveWire(idx, idx - 1)}
                      className="w-5 h-5 bg-slate-800 hover:bg-cyan-600 disabled:opacity-30 rounded text-xs flex items-center justify-center"
                    >
                      →
                    </button>
                    <button 
                      disabled={idx === 7} 
                      onClick={() => moveWire(idx, idx + 1)}
                      className="w-5 h-5 bg-slate-800 hover:bg-cyan-600 disabled:opacity-30 rounded text-xs flex items-center justify-center"
                    >
                      ←
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* زر الفحص والكبس بالمكابس Crimping tool */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={verifyCrimping}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20"
            >
              كبس الموصل وفحص التوصيل (Test Cable)
            </button>
          </div>
        </div>

        {/* نتيجة الكبس */}
        {isCrimpSuccess !== null && (
          <div className={`mt-3 p-3 rounded-xl border text-xs font-bold text-center w-full max-w-md ${
            isCrimpSuccess 
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' 
              : 'bg-rose-950/80 border-rose-500 text-rose-300'
          }`}>
            {isCrimpSuccess ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>أحسنت! ترتيب الأسلاك صحيح 100% وفق معيار T568B. الكابل جاهز للعمل بسرعة 1Gbps.</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>خطأ في الترتيب! لن تنقل البيانات بصورة سليمة. تذكر: يبدأ المعيار دائماً بـ [أبيض/برتقالي، ثم برتقالي].</span>
              </div>
            )}
          </div>
        )}

        {(showSolution || isCrimpSuccess) && (
          <div className="mt-2 text-[11px] text-amber-300/90 font-mono">
            الحل النموذجي T568B: (1: أبيض/برتقالي) (2: برتقالي) (3: أبيض/أخضر) (4: أزرق) (5: أبيض/أزرق) (6: أخضر) (7: أبيض/بني) (8: بني)
          </div>
        )}
      </div>
    </div>
  );
}

/** الوحدة 5: مشاركة الموارد (طابعة + مجلدات وخادم) */
function ModuleResourceSharing({ 
  sharingJob, setSharingJob, addLog 
}: { 
  sharingJob: any; 
  setSharingJob: (j: any) => void;
  addLog: (m: string) => void;
}) {
  const startPrintJob = (file: string, fromPC: string) => {
    setSharingJob({ step: 1, file, target: 'printer' });
    addLog(`أرسل ${fromPC} أمر طباعة المستند: [${file}] عبر الشبكة.`);

    setTimeout(() => {
      setSharingJob({ step: 2, file, target: 'printer' });
      addLog(`الحزمة تمر عبر Switch القاعة متجهة للمنفذ 192.168.1.20.`);
    }, 1200);

    setTimeout(() => {
      setSharingJob({ step: 3, file, target: 'printer' });
      addLog(`✅ تمت طباعة المستند [${file}] بنجاح على الطابعة المشتركة.`);
    }, 2600);
  };

  return (
    <div className="flex-1 p-6 flex flex-col space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Printer className="text-cyan-400 w-6 h-6" />
          الوحدة الخامسة: مشاركة الموارد (Partage des Ressources)
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          تمكننا الشبكة المحلية من مشاركة العتاد (طابعات، وسائط تخزين) والبرمجيات والملفات لتوفير التكاليف وتسهيل التعاون التربوي.
        </p>
      </div>

      <div className="flex-1 bg-[#090e1c] rounded-2xl border border-cyan-900/60 p-6 flex flex-col justify-between">
        
        {/* ساحة محاكاة إرسال ملف للطباعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* حاسوب تلميذ 1 */}
          <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Monitor className="text-blue-400 w-5 h-5" />
              <span>حاسوب التلميذ (أحمد)</span>
            </div>
            <div className="text-xs text-slate-400">ملف الفرض المنزلي جاهز للطباعة:</div>
            <button
              onClick={() => startPrintJob('فرض_المعلوماتية_أحمد.pdf', 'حاسوب أحمد')}
              disabled={sharingJob?.step === 1 || sharingJob?.step === 2}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs"
            >
              إرسال أمر الطباعة ➔
            </button>
          </div>

          {/* وسيط الربط والشبكة */}
          <div className="flex flex-col items-center justify-center text-center p-4">
            <Cpu className="w-10 h-10 text-cyan-400 animate-pulse mb-2" />
            <span className="text-xs font-mono text-cyan-300">مبدل القاعة Switch</span>
            <div className="w-full h-1 bg-slate-800 my-2 relative overflow-hidden rounded-full">
              {sharingJob && (
                <div className="absolute top-0 bottom-0 bg-cyan-400 w-1/3 animate-ping" />
              )}
            </div>
            <span className="text-[10px] text-slate-400">نقل إطار المعطيات عبر كابل UTP</span>
          </div>

          {/* الطابعة المركزية المشتركة */}
          <div className={`p-4 rounded-xl border text-center transition-all ${
            sharingJob?.step === 3 
              ? 'bg-emerald-950/80 border-emerald-400 shadow-xl shadow-emerald-500/20' 
              : 'bg-slate-900 border-slate-700'
          }`}>
            <Printer className={`w-10 h-10 mx-auto mb-2 ${sharingJob?.step === 3 ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div className="text-sm font-bold text-white">طابعة المخبر المركزية</div>
            <div className="text-[11px] text-cyan-300 font-mono mt-0.5">IP: 192.168.1.20</div>
            
            <div className="mt-3 text-xs">
              {sharingJob?.step === 3 ? (
                <span className="text-emerald-300 font-bold">يتم إخراج الورقة الآن...</span>
              ) : (
                <span className="text-slate-500">جاهزة لاستقبال الأوامر</span>
              )}
            </div>
          </div>
        </div>

        {/* فوائد المشاركة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-cyan-900/40 text-xs">
            <span className="font-bold text-cyan-400 block mb-1">مشاركة العتاد (Hardware Sharing):</span>
            شراء طابعة ليزرية واحدة فائقة الجودة لـ 20 حاسوباً بدلاً من 20 طابعة شخصية يوفر 90% من ميزانية المؤسسة ويخفض مصاريف الحبر والصيانة.
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-cyan-900/40 text-xs">
            <span className="font-bold text-cyan-400 block mb-1">مشاركة البرامج والبيانات (Data/Software Sharing):</span>
            العمل المشترك على ملفات الجداءات، حفظ المشاريع في مجلد الخادم المشترك (Shared Folder)، والنسخ الاحتياطي التلقائي.
          </div>
        </div>
      </div>
    </div>
  );
}

/** الوحدة 6: الأمن والصيانة ولعبة اكتشاف الخطأ في الشبكة */
function ModuleSecurityTroubleshoot({ addLog }: { addLog: (m: string) => void }) {
  const [fixedIssues, setFixedIssues] = useState<string[]>([]);

  const issues = [
    { id: 'cable', title: 'كابل مفصول', desc: 'كابل الربط الخاص بالحاسوب 03 منزوع من بطاقة الشبكة NIC.' },
    { id: 'ip_conflict', title: 'تعارض في عناوين IP', desc: 'الحاسوب 02 والحاسوب 05 يحملان نفس العنوان: 192.168.1.15.' },
    { id: 'share_perm', title: 'صلاحيات وصول خاطئة', desc: 'مجلد فروض الأستاذ متاح للجميع بصلاحية التعديل والحذف بدلاً من القراءة فقط.' }
  ];

  const handleFix = (id: string) => {
    if (!fixedIssues.includes(id)) {
      setFixedIssues([...fixedIssues, id]);
      addLog(`تم حل المشكل: [${issues.find(x => x.id === id)?.title}] بنجاح.`);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="text-cyan-400 w-6 h-6" />
          الوحدة السادسة: أمن الشبكات وصيانتها (Sécurité et Maintenance)
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          تعلم التدابير الأمنية لحماية البيانات داخل LAN وحل الأعطال الشائعة التي تواجه مسؤول الشبكة المدرسية.
        </p>
      </div>

      <div className="flex-1 bg-[#090e1c] rounded-2xl border border-cyan-900/60 p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4" /> لعبة: "تشخيص وإصلاح أعطال قاعة الإعلام الآلي"
          </h3>

          <div className="space-y-3">
            {issues.map(iss => {
              const isResolved = fixedIssues.includes(iss.id);
              return (
                <div key={iss.id} className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{iss.title}</span>
                      {isResolved ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500">تم الإصلاح ✅</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500">عطل نشط ⚠️</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{iss.desc}</p>
                  </div>

                  <button
                    disabled={isResolved}
                    onClick={() => handleFix(iss.id)}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-xs font-bold text-white rounded-lg"
                  >
                    {isResolved ? 'سليم' : 'إصلاح العطل'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* المبادئ الوقائية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
          <div className="p-2.5 bg-slate-900/40 rounded-lg">
            <span className="font-bold text-cyan-400 block mb-0.5">كلمات مرور قوية:</span>
            تغيير كلمة المرور الافتراضية للروتر والمبدل وتعيين كلمات مرور معقدة لحسابات التلاميذ.
          </div>
          <div className="p-2.5 bg-slate-900/40 rounded-lg">
            <span className="font-bold text-cyan-400 block mb-0.5">صلاحيات الوصول:</span>
            تطبيق مبدأ الحد الأدنى من الامتيازات (Permissions) لمنع حذف وتخريب الدروس.
          </div>
          <div className="p-2.5 bg-slate-900/40 rounded-lg">
            <span className="font-bold text-cyan-400 block mb-0.5">الصيانة المادية:</span>
            تنظيم مسارات الكابلات داخل قنوات بلاستيكية وتجنب الثني الحاد لكابلات الألياف.
          </div>
        </div>
      </div>
    </div>
  );
}

/** الوحدة 7: المختبر الافتراضي المفتوح Sandbox Simulator */
function ModuleSandboxSimulator({
  nodes, setNodes, links, setLinks, isSimulating, setIsSimulating, addLog, onSelectNode
}: {
  nodes: NetworkNode[];
  setNodes: React.Dispatch<React.SetStateAction<NetworkNode[]>>;
  links: NetworkLink[];
  setLinks: React.Dispatch<React.SetStateAction<NetworkLink[]>>;
  isSimulating: boolean;
  setIsSimulating: (s: boolean) => void;
  addLog: (m: string) => void;
  onSelectNode: (n: NetworkNode) => void;
}) {
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const addDevice = (type: DeviceType) => {
    const id = `${type}_${Date.now().toString().slice(-4)}`;
    const names: Record<DeviceType, string> = {
      pc: `حاسوب ${nodes.filter(n => n.type === 'pc').length + 1}`,
      switch: 'مبدل Switch إضافي',
      hub: 'موزع Hub إضافي',
      router: 'موجه Router خارجي',
      server: 'خادم تخزين إضافي',
      printer: 'طابعة شبكية ثانية'
    };
    const newNode: NetworkNode = {
      id,
      name: names[type],
      type,
      x: 100 + Math.random() * 400,
      y: 80 + Math.random() * 250,
      ip: `192.168.1.${Math.floor(Math.random() * 200) + 30}`,
      mac: `00:1A:3F:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
      status: 'online'
    };
    setNodes(prev => [...prev, newNode]);
    addLog(`تمت إضافة الجهاز [${newNode.name}] إلى مساحة العمل.`);
  };

  const handleNodeClick = (node: NetworkNode) => {
    onSelectNode(node);
    if (!connectingFrom) {
      setConnectingFrom(node.id);
      addLog(`تم تحديد [${node.name}] كنقطة بداية لمد الكابل. انقر على جهاز آخر للربط.`);
    } else {
      if (connectingFrom !== node.id) {
        // التحقق من عدم وجود رابط سابق
        const exists = links.some(l => 
          (l.from === connectingFrom && l.to === node.id) || 
          (l.from === node.id && l.to === connectingFrom)
        );
        if (!exists) {
          const newLink: NetworkLink = {
            id: `link_${Date.now()}`,
            from: connectingFrom,
            to: node.id,
            type: 'utp',
            speedMbps: 100,
            status: 'active'
          };
          setLinks(prev => [...prev, newLink]);
          addLog(`✅ تم توصيل كابل إيثرنت UTP بين الجهازين بنجاح.`);
        }
      }
      setConnectingFrom(null);
    }
  };

  const pingAll = () => {
    setIsSimulating(true);
    addLog(`بدء اختبار الاتصال الشامل (Ping broadcast) لفحص سلامة التوصيلات...`);
    setTimeout(() => {
      setIsSimulating(false);
      addLog(`اكتمل الفحص: كافة الأجهزة الموصولة بـ Switch ترد بإشارات Echo Reply سليمة.`);
    }, 2000);
  };

  return (
    <div className="flex-1 p-6 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="text-cyan-400 w-6 h-6" />
            الوحدة السابعة: المختبر الحر لبناء الشبكة (Sandbox Network Designer)
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            أضف الأجهزة، مد الكابلات بينها يدوياً، اختبر الاتصال وشاهد سريان البيانات بصرياً.
          </p>
        </div>

        {/* أزرار التحكم بالمحاكاة */}
        <div className="flex gap-2">
          <button
            onClick={pingAll}
            disabled={isSimulating}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>تشغيل فحص البيانات (Ping)</span>
          </button>
          <button
            onClick={() => { setNodes([]); setLinks([]); }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إفراغ المختبر</span>
          </button>
        </div>
      </div>

      {/* شريط إضافة المكونات */}
      <div className="bg-[#10182b] p-3 rounded-xl border border-cyan-900/50 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-cyan-400 whitespace-nowrap ml-2">إضافة عتاد:</span>
        {[
          { type: 'pc', label: '+ حاسوب PC', icon: Monitor },
          { type: 'switch', label: '+ مبدل Switch', icon: Cpu },
          { type: 'hub', label: '+ موزع Hub', icon: Layers },
          { type: 'router', label: '+ موجه Router', icon: Network },
          { type: 'server', label: '+ خادم Server', icon: Server },
          { type: 'printer', label: '+ طابعة', icon: Printer }
        ].map(item => (
          <button
            key={item.type}
            onClick={() => addDevice(item.type as DeviceType)}
            className="px-3 py-1.5 bg-slate-800/90 hover:bg-cyan-600/30 hover:border-cyan-400 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <item.icon className="w-3.5 h-3.5 text-cyan-400" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* مساحة الرسم SVG التفاعلية للشبكة */}
      <div className="flex-1 bg-[#080d19] rounded-2xl border-2 border-dashed border-cyan-900/60 relative overflow-hidden min-h-[400px]">
        
        <svg className="w-full h-full absolute inset-0 pointer-events-none">
          {/* رسم الكابلات بين الأجهزة */}
          {links.map(link => {
            const fromNode = nodes.find(n => n.id === link.from);
            const toNode = nodes.find(n => n.id === link.to);
            if (!fromNode || !toNode) return null;

            return (
              <g key={link.id}>
                <line
                  x1={fromNode.x + 35}
                  y1={fromNode.y + 35}
                  x2={toNode.x + 35}
                  y2={toNode.y + 35}
                  stroke={link.type === 'fiber' ? '#00e5ff' : '#0284c7'}
                  strokeWidth="3"
                  strokeDasharray={isSimulating ? "6,6" : "none"}
                  className={isSimulating ? "animate-pulse" : ""}
                />
              </g>
            );
          })}
        </svg>

        {/* عرض الأجهزة فوق مساحة العمل */}
        {nodes.map(node => {
          const isSelectedForWire = connectingFrom === node.id;
          return (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node)}
              style={{ left: `${node.x}px`, top: `${node.y}px` }}
              className={`absolute cursor-pointer p-3 rounded-2xl border-2 transition-all select-none shadow-xl flex flex-col items-center justify-center ${
                isSelectedForWire 
                  ? 'bg-amber-950/80 border-amber-400 scale-105 shadow-amber-500/30' 
                  : 'bg-slate-900/90 border-slate-700 hover:border-cyan-400 hover:scale-105'
              }`}
            >
              {node.type === 'pc' && <Monitor className="w-7 h-7 text-cyan-300" />}
              {node.type === 'switch' && <Cpu className="w-7 h-7 text-emerald-400" />}
              {node.type === 'hub' && <Layers className="w-7 h-7 text-amber-400" />}
              {node.type === 'router' && <Network className="w-7 h-7 text-indigo-400" />}
              {node.type === 'server' && <Server className="w-7 h-7 text-purple-400" />}
              {node.type === 'printer' && <Printer className="w-7 h-7 text-pink-400" />}

              <span className="text-[11px] font-bold text-white mt-1">{node.name}</span>
              <span className="text-[9px] text-cyan-400 font-mono">{node.ip}</span>
            </div>
          );
        })}

        {connectingFrom && (
          <div className="absolute bottom-4 left-4 bg-amber-950/90 border border-amber-500/80 px-4 py-2 rounded-xl text-xs text-amber-200">
            وضع التوصيل: انقر على الجهاز الثاني لإنهاء مد الكابل...
          </div>
        )}
      </div>
    </div>
  );
}

/** الوحدة 8: التحديات والاختبارات التفاعلية مع بنك الأسئلة للمنهاج الجزائري */
function ModuleQuizzesAndChallenges() {
  const [currentQ, setCurrentQ] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  const questions = [
    {
      q: 'ما هو الدور الجوهري الذي تؤديه بطاقة الشبكة (NIC) في الحاسوب؟',
      opts: [
        'زيادة سعة القرص الصلب لحفظ البرامج',
        'تحويل المعطيات الثنائية إلى إشارات كهربائية أو ضوئية قابلة للانتقال عبر الوسيط',
        'تنظيف الحاسوب من الفيروسات',
        'تزويد الشاشة بالطاقة الكهربائية'
      ],
      correct: 1,
      why: 'بطاقة الشبكة NIC هي الواجهة العتادية التي تحول البيانات الرقمية إلى إشارات وتمنح الحاسوب عنوانه الفيزيائي MAC الفريد عالمياً.'
    },
    {
      q: 'لماذا يُفضل استخدام المبدل (Switch) بدلاً من الموزع (Hub) في قاعات الإعلام الآلي؟',
      opts: [
        'لأنه أرخص ثمناً فقط',
        'لأنه لا يحتاج إلى كابلات إيثرنت',
        'لأنه يوجه الحزم للمنفذ الهدف فقط بالاعتماد على MAC Address مما يلغي التصادم',
        'لأنه يعطل الإنترنت عند انتهاء الحصة'
      ],
      correct: 2,
      why: 'المبدل Switch ذكي؛ فهو يقرأ عنوان الهدف ويوجه الإطار إليه فقط، بينما يرسل Hub الإشارة لكافة الأجهزة مسبباً بطئاً واختناقاً.'
    },
    {
      q: 'أي طوبولوجيا تتوقف كلياً عن العمل إذا انقطع الكابل الرئيسي المزود بموقفات (Terminators)؟',
      opts: [
        'الطوبولوجيا النجمية (Star)',
        'الطوبولوجيا الخطية (Bus)',
        'الطوبولوجيا الشبكية (Mesh)',
        'الشبكة اللاسلكية (WLAN)'
      ],
      correct: 1,
      why: 'في الطوبولوجيا الخطية Bus، تشترك كافة الحواسيب في سلك محوري رئيسي وحيد؛ وانقطاعه في أي نقطة يؤدي لانهيار الشبكة كلياً.'
    },
    {
      q: 'ما هو الترتيب الصحيح لأول سلكين في كابل RJ-45 وفق المعيار القياسي T-568B؟',
      opts: [
        '1: برتقالي / 2: أبيض برتقالي',
        '1: أبيض برتقالي / 2: برتقالي',
        '1: أبيض أخضر / 2: أزرق',
        '1: بني / 2: أبيض بني'
      ],
      correct: 1,
      why: 'يبدأ المعيار T568B بالسلك الأبيض البرتقالي (Pin 1) يليه السلك البرتقالي الصامت (Pin 2).'
    }
  ];

  const handleAnswer = (idx: number) => {
    setSelectedOpt(idx);
    if (idx === questions[currentQ].correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedOpt(null);
    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      setQuizFinished(true);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <GraduationCap className="text-cyan-400 w-6 h-6" />
          الوحدة الثامنة: التقييم البيداغوجي والتحديات
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          اختبر معارفك المحصلة خلال درس الشبكة المحلية وفق مقرر السنة الأولى ثانوي.
        </p>
      </div>

      <div className="flex-1 bg-[#090e1c] rounded-2xl border border-cyan-900/60 p-8 flex flex-col justify-center max-w-3xl mx-auto w-full">
        {!quizFinished ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center text-xs font-mono text-cyan-400 pb-3 border-b border-slate-800">
              <span>السؤال {currentQ + 1} من {questions.length}</span>
              <span>النقاط الحالية: {score}</span>
            </div>

            <h3 className="text-base font-bold text-white leading-relaxed">
              {questions[currentQ].q}
            </h3>

            <div className="space-y-2.5">
              {questions[currentQ].opts.map((opt, i) => {
                let btnStyle = 'bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-500';
                if (selectedOpt !== null) {
                  if (i === questions[currentQ].correct) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                  } else if (i === selectedOpt) {
                    btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                  }
                }
                return (
                  <button
                    key={i}
                    disabled={selectedOpt !== null}
                    onClick={() => handleAnswer(i)}
                    className={`w-full p-3.5 rounded-xl border text-right text-xs transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {selectedOpt !== null && i === questions[currentQ].correct && (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mr-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedOpt !== null && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-cyan-400 block">التبرير العلمي:</span>
                <p>{questions[currentQ].why}</p>
              </div>
            )}

            {selectedOpt !== null && (
              <div className="flex justify-end">
                <button
                  onClick={nextQuestion}
                  className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <span>{currentQ + 1 === questions.length ? 'عرض النتيجة النهائية' : 'السؤال الموالي'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white">اكتمل التحدي بنجاح!</h3>
            <p className="text-sm text-slate-300">
              نتيجتك في التقييم: <span className="text-cyan-400 font-bold font-mono text-lg">{score}</span> / {questions.length}
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {score >= 3 
                ? 'ممتاز! لقد استوعبت مفاهيم المنهاج الخاص بالشبكة المحلية LAN ومكوناتها وطوبولوجياتها بجدارة.'
                : 'يُنصح بإعادة زيارة وحدتي عتاد الربط (Hub vs Switch) والطوبولوجيا لترسيخ المفاهيم.'}
            </p>
            <button
              onClick={() => { setCurrentQ(0); setSelectedOpt(null); setScore(0); setQuizFinished(false); }}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
            >
              إعادة الاختبار
            </button>
          </div>
        )}
      </div>
    </div>
  );
}