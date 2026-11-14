/* =====================================================================
   MAPA 3D DO CIMOL + ROBO (simulacao) + DADOS DO ROBO
   - Prediais A..E montados a partir da foto de satelite (cimol.png)
   - A: 3 andares | B: 1 andar | C: 3 andares
     D: 1 andar, no nivel do 2o andar do C
     E: 1 andar, no mesmo nivel do B
   - O robo anda sozinho ate as centrais quando o botao e clicado
   ===================================================================== */
(function () {
  "use strict";

  var THREE = window.THREE;
  var contenedor = document.getElementById("mapa3d");
  if (!THREE || !contenedor) return;

  /* ---------- Conversao da imagem (pixels) para o mundo 3D ---------- */
  var IMG_W = 1041, IMG_H = 773;
  var PX = 10;                  // 10 pixels = 1 unidade
  var CX = 520, CZ = 440;       // pixel que vira a origem do mundo
  var ESCALA_M = 2;             // 1 unidade = 2 metros (aproximado)
  function wx(px) { return (px - CX) / PX; }
  function wz(py) { return (py - CZ) / PX; }

  var H = 2.8;                  // altura de um andar

  // Retangulos dos predios na imagem (x1, y1, x2, y2)
  var PREDIOS = [
    { id: "C", rect: [322, 300, 608, 372], andares: 3, base: 0 },
    { id: "B", rect: [305, 400, 510, 447], andares: 1, base: 0 },
    { id: "A", rect: [300, 480, 505, 545], andares: 3, base: 0 },
    // D fica sobre um bloco (pedestal) para chegar ao nivel do 2o andar do C
    { id: "D", rect: [622, 327, 775, 445], andares: 1, base: H },
    { id: "E", rect: [508, 447, 760, 580], andares: 1, base: 0 }
  ];

  PREDIOS.forEach(function (p) {
    p.x1 = wx(p.rect[0]); p.x2 = wx(p.rect[2]);
    p.z1 = wz(p.rect[1]); p.z2 = wz(p.rect[3]);
    p.w = p.x2 - p.x1; p.d = p.z2 - p.z1;
    p.cx = (p.x1 + p.x2) / 2; p.cz = (p.z1 + p.z2) / 2;
    p.topo = p.base + p.andares * H;
  });

  /* ---------- Pontos importantes ---------- */
  var BASE = new THREE.Vector3(10, 0, 7);              // dentro do predio E
  var CENTRAL_A = new THREE.Vector3(-12, 0, 7.2);      // predio A, terreo
  var CENTRAL_C = new THREE.Vector3(-5, H, -10.4);     // predio C, 2o andar

  // Rampa no corredor entre C e D (onde fica a ponte), descendo para o lado do B
  var RAMPA = { x: 9.5, zBaixo: -1, zAlto: -7.4, larg: 1.4 };

  // Rotas saindo da base (lista de pontos 3D)
  var ROTAS = {
    base: [BASE.clone()],
    A: [
      BASE.clone(),
      new THREE.Vector3(0, 0, 7.1),
      CENTRAL_A.clone()
    ],
    C: [
      BASE.clone(),
      new THREE.Vector3(2, 0, 3),
      new THREE.Vector3(RAMPA.x, 0, RAMPA.zBaixo),
      new THREE.Vector3(RAMPA.x, H, RAMPA.zAlto),
      new THREE.Vector3(RAMPA.x, H, -8.6),
      new THREE.Vector3(7, H, -9.2),
      CENTRAL_C.clone()
    ]
  };

  var NOMES = {
    base: "Base (Prédio E)",
    A: "Central A",
    C: "Central C"
  };

  /* ---------- Cena, camera, luzes ---------- */
  var cena = new THREE.Scene();
  cena.background = new THREE.Color(0x0a2822);

  var camera = new THREE.PerspectiveCamera(40, 1, 0.5, 600);
  var VISAO_GERAL = {
    pos: new THREE.Vector3(2, 46, 40),
    alvo: new THREE.Vector3(2, 0, -3)
  };
  camera.position.copy(VISAO_GERAL.pos);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  contenedor.appendChild(renderer.domElement);

  var controles = new THREE.OrbitControls(camera, renderer.domElement);
  controles.target.copy(VISAO_GERAL.alvo);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.minDistance = 14;
  controles.maxDistance = 110;
  controles.maxPolarAngle = Math.PI * 0.46;
  controles.screenSpacePanning = false;
  controles.update();

  cena.add(new THREE.AmbientLight(0xffffff, 0.6));
  var sol = new THREE.DirectionalLight(0xffffff, 0.6);
  sol.position.set(30, 60, 25);
  cena.add(sol);
  cena.add(new THREE.HemisphereLight(0xeafff6, 0x1b4d40, 0.35));

  /* ---------- Chao: foto de satelite ---------- */
  var carregador = new THREE.TextureLoader();
  var textura = carregador.load("cimol.png", function () {
    textura.anisotropy = renderer.capabilities.getMaxAnisotropy();
  });
  var chaoLarg = IMG_W / PX, chaoProf = IMG_H / PX;
  var chao = new THREE.Mesh(
    new THREE.PlaneGeometry(chaoLarg, chaoProf),
    new THREE.MeshBasicMaterial({ map: textura, color: 0xc9d4cf })
  );
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(wx(IMG_W / 2), -0.02, wz(IMG_H / 2));
  cena.add(chao);

  /* ---------- Utilitarios ---------- */
  function etiqueta(texto, opc) {
    opc = opc || {};
    var fonte = opc.fonte || 44;
    var cv = document.createElement("canvas");
    var c2 = cv.getContext("2d");
    c2.font = "700 " + fonte + "px Segoe UI, system-ui, sans-serif";
    var larg = Math.ceil(c2.measureText(texto).width) + fonte * 1.1;
    var alt = Math.ceil(fonte * 1.7);
    cv.width = larg; cv.height = alt;
    c2.font = "700 " + fonte + "px Segoe UI, system-ui, sans-serif";
    c2.fillStyle = opc.fundo || "rgba(6,48,40,0.88)";
    c2.fillRect(2, 2, larg - 4, alt - 4);
    c2.lineWidth = 3; c2.strokeStyle = opc.borda || "rgba(255,255,255,0.85)";
    c2.strokeRect(2, 2, larg - 4, alt - 4);
    c2.fillStyle = opc.cor || "#ffffff";
    c2.textAlign = "center"; c2.textBaseline = "middle";
    c2.fillText(texto, larg / 2, alt / 2 + 2);
    var tex = new THREE.CanvasTexture(cv);
    var spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, depthTest: false, transparent: true
    }));
    var esc = opc.escala || 0.035;
    spr.scale.set(larg * esc, alt * esc, 1);
    spr.renderOrder = 20;
    return spr;
  }

  var materiaisParedes = [];   // para o modo raio-x
  var materiaisLajes = [];

  function criarPredio(p) {
    var grupo = new THREE.Group();
    var alturaTotal = p.andares * H;

    // Pedestal solido (so o D)
    if (p.base > 0) {
      var ped = new THREE.Mesh(
        new THREE.BoxGeometry(p.w, p.base, p.d),
        new THREE.MeshStandardMaterial({ color: 0x6f8a80, roughness: 0.95 })
      );
      ped.position.set(p.cx, p.base / 2, p.cz);
      grupo.add(ped);
      var pedBorda = new THREE.LineSegments(
        new THREE.EdgesGeometry(ped.geometry),
        new THREE.LineBasicMaterial({ color: 0x4b635a })
      );
      pedBorda.position.copy(ped.position);
      grupo.add(pedBorda);
    }

    // Paredes + teto (caixa transparente)
    var mat = new THREE.MeshStandardMaterial({
      color: p.id === "D" || p.id === "E" ? 0xdbe9f2 : 0xd3e8de,
      roughness: 0.75, metalness: 0.05,
      transparent: true, opacity: 0.32, depthWrite: false
    });
    materiaisParedes.push(mat);
    var caixa = new THREE.Mesh(new THREE.BoxGeometry(p.w, alturaTotal, p.d), mat);
    caixa.position.set(p.cx, p.base + alturaTotal / 2, p.cz);
    caixa.renderOrder = 5;
    grupo.add(caixa);

    var borda = new THREE.LineSegments(
      new THREE.EdgesGeometry(caixa.geometry),
      new THREE.LineBasicMaterial({ color: 0x0f766e })
    );
    borda.position.copy(caixa.position);
    grupo.add(borda);

    // Lajes de cada andar (inclusive o piso do primeiro)
    for (var k = 0; k < p.andares; k++) {
      var matLaje = new THREE.MeshStandardMaterial({
        color: 0xf2faf6, roughness: 1,
        transparent: true, opacity: k === 0 ? 0.5 : 0.3,
        depthWrite: false, side: THREE.DoubleSide
      });
      materiaisLajes.push(matLaje);
      var laje = new THREE.Mesh(new THREE.PlaneGeometry(p.w - 0.1, p.d - 0.1), matLaje);
      laje.rotation.x = -Math.PI / 2;
      laje.position.set(p.cx, p.base + k * H + 0.04, p.cz);
      laje.renderOrder = 4;
      grupo.add(laje);

      if (k > 0) {
        var contorno = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(p.w, 0.001, p.d)),
          new THREE.LineBasicMaterial({ color: 0x14b8a6 })
        );
        contorno.position.set(p.cx, p.base + k * H, p.cz);
        grupo.add(contorno);
      }
    }

    // Letra do predio no teto
    var letra = etiqueta(p.id, {
      fonte: 60, escala: 0.03,
      fundo: "rgba(6,95,70,0.92)", borda: "#ffffff"
    });
    letra.position.set(p.cx, p.topo + 1.8, p.cz);
    grupo.add(letra);

    cena.add(grupo);
  }

  PREDIOS.forEach(criarPredio);

  // Ponte curta entre D e o 2o andar do C
  (function () {
    var ponte = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.2, 2.4),
      new THREE.MeshStandardMaterial({ color: 0xcfd9d4 })
    );
    ponte.position.set(RAMPA.x, H - 0.1, -8.6);
    cena.add(ponte);
  })();

  // Rampa de acesso (corredor entre C e D) ate o nivel do 2o andar
  (function () {
    var dz = RAMPA.zBaixo - RAMPA.zAlto;
    var comp = Math.sqrt(dz * dz + H * H);
    var ang = Math.atan2(H, dz);
    var zc = (RAMPA.zBaixo + RAMPA.zAlto) / 2;
    var rampa = new THREE.Mesh(
      new THREE.BoxGeometry(RAMPA.larg, 0.25, comp),
      new THREE.MeshStandardMaterial({ color: 0xe9d8a6, roughness: 0.85 })
    );
    rampa.position.set(RAMPA.x, H / 2 - 0.12, zc);
    rampa.rotation.x = ang;
    cena.add(rampa);

    var lado = new THREE.MeshStandardMaterial({ color: 0x0f766e });
    [-1, 1].forEach(function (s) {
      var guia = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, comp), lado);
      guia.position.set(RAMPA.x + s * (RAMPA.larg / 2), H / 2 + 0.1, zc);
      guia.rotation.x = ang;
      cena.add(guia);
    });
  })();

  /* ---------- Centrais e base ---------- */
  var centraisObj = {};

  function criarPonto(chave, pos, cor, texto) {
    var g = new THREE.Group();
    g.position.copy(pos);

    var pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2.5, 0.3, 40),
      new THREE.MeshStandardMaterial({ color: cor, roughness: 0.5, emissive: cor, emissiveIntensity: 0.25 })
    );
    pad.position.y = 0.16;
    g.add(pad);

    var feixe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 6, 12),
      new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.55, depthWrite: false })
    );
    feixe.position.y = 3.2;
    g.add(feixe);

    var topo = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 20, 20),
      new THREE.MeshBasicMaterial({ color: cor })
    );
    topo.position.y = 6.4;
    g.add(topo);

    var anel = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 3.0, 48),
      new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })
    );
    anel.rotation.x = -Math.PI / 2;
    anel.position.y = 0.35;
    g.add(anel);

    var rot = etiqueta(texto, { fonte: 40, escala: 0.03, fundo: "rgba(255,255,255,0.95)", cor: "#0b2e28", borda: cor });
    rot.position.y = 10.6;
    g.add(rot);

    cena.add(g);
    centraisObj[chave] = { anel: anel, topo: topo, feixe: feixe };
  }

  criarPonto("C", CENTRAL_C, 0xf59e0b, "Central C · 2º andar");
  criarPonto("A", CENTRAL_A, 0xf59e0b, "Central A");
  criarPonto("base", BASE, 0x38bdf8, "Base");

  /* ---------- Robo ---------- */
  var robo = new THREE.Group();
  robo.rotation.order = "YXZ";
  (function () {
    var corpo = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.45, metalness: 0.2 });
    var escuro = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    var claro = new THREE.MeshStandardMaterial({ color: 0xe5f6ee, roughness: 0.5 });

    function caixa(w, h, d, mat, x, y, z) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      robo.add(m);
      return m;
    }

    // esteiras
    caixa(0.55, 0.55, 2.7, escuro, -0.9, 0.3, 0);
    caixa(0.55, 0.55, 2.7, escuro, 0.9, 0.3, 0);
    // flippers (bracos articulados)
    [-1, 1].forEach(function (s) {
      var f1 = caixa(0.5, 0.28, 1.1, escuro, s * 0.9, 0.38, 1.7);
      f1.rotation.x = -0.35;
      var f2 = caixa(0.5, 0.28, 1.1, escuro, s * 0.9, 0.38, -1.7);
      f2.rotation.x = 0.35;
    });
    // chassi e compartimento
    caixa(1.5, 0.5, 2.3, corpo, 0, 0.85, 0);
    caixa(1.3, 0.45, 1.1, claro, 0, 1.3, -0.45);
    // camera
    var cam = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0x0b2e28 })
    );
    cam.position.set(0, 1.25, 0.75);
    robo.add(cam);
    var lente = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9 })
    );
    lente.position.set(0, 1.27, 1.02);
    robo.add(lente);
    // garra
    caixa(0.15, 0.15, 0.9, escuro, -0.35, 0.95, 1.55);
    caixa(0.15, 0.15, 0.9, escuro, 0.35, 0.95, 1.55);
    // luz de status
    var luz = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x4ade80 })
    );
    luz.position.set(0, 1.62, -0.9);
    robo.add(luz);
    robo.userData.luz = luz;
  })();
  robo.scale.setScalar(0.6);
  robo.position.copy(BASE);
  cena.add(robo);

  // Sombra simples embaixo do robo
  var sombra = new THREE.Mesh(
    new THREE.CircleGeometry(1.0, 28),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })
  );
  sombra.rotation.x = -Math.PI / 2;
  cena.add(sombra);

  // Indicativo (pino) acima do robo + anel pulsante no chao
  var marcador = new THREE.Group();
  var pino = new THREE.Mesh(
    new THREE.ConeGeometry(1.0, 2.2, 24),
    new THREE.MeshBasicMaterial({ color: 0xff4d4f, depthTest: false, transparent: true })
  );
  pino.rotation.x = Math.PI;
  pino.renderOrder = 30;
  var pinoBola = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xff4d4f, depthTest: false, transparent: true })
  );
  pinoBola.position.y = 1.5;
  pinoBola.renderOrder = 30;
  var pinoMiolo = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true })
  );
  pinoMiolo.position.y = 1.5;
  pinoMiolo.renderOrder = 31;
  var pinoGrupo = new THREE.Group();
  pinoGrupo.add(pino, pinoBola, pinoMiolo);
  pinoGrupo.scale.setScalar(0.6);
  marcador.add(pinoGrupo);

  var rotRobo = etiqueta("Robô", { fonte: 38, escala: 0.03, fundo: "rgba(220,38,38,0.95)", borda: "#ffffff" });
  rotRobo.position.y = 3.6;
  marcador.add(rotRobo);

  var anelRobo = new THREE.Mesh(
    new THREE.RingGeometry(1.0, 1.2, 40),
    new THREE.MeshBasicMaterial({ color: 0xff4d4f, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })
  );
  anelRobo.rotation.x = -Math.PI / 2;
  marcador.add(anelRobo);
  cena.add(marcador);

  /* ---------- Trilha do trajeto ---------- */
  var trilha = null;
  function mostrarTrilha(pontos) {
    limparTrilha();
    var geo = new THREE.BufferGeometry().setFromPoints(
      pontos.map(function (p) { return new THREE.Vector3(p.x, p.y + 0.2, p.z); })
    );
    trilha = new THREE.Line(geo, new THREE.LineDashedMaterial({
      color: 0xfacc15, dashSize: 0.9, gapSize: 0.6, depthTest: false, transparent: true
    }));
    trilha.computeLineDistances();
    trilha.renderOrder = 15;
    cena.add(trilha);
  }
  function limparTrilha() {
    if (trilha) {
      cena.remove(trilha);
      trilha.geometry.dispose();
      trilha = null;
    }
  }

  /* =====================================================================
     DADOS / ESTADO DO ROBO
     ===================================================================== */
  var CHAVE_DADOS = "monitorRobo.dados";
  var dados = { itens: 0, kg: 0, centralA: 0, centralC: 0, dist: 0 };
  try {
    var salvo = JSON.parse(localStorage.getItem(CHAVE_DADOS) || "null");
    if (salvo && typeof salvo === "object") {
      Object.keys(dados).forEach(function (k) {
        if (typeof salvo[k] === "number" && isFinite(salvo[k])) dados[k] = salvo[k];
      });
    }
  } catch (e) { /* sem localStorage: segue com zeros */ }

  function salvarDados() {
    try { localStorage.setItem(CHAVE_DADOS, JSON.stringify(dados)); } catch (e) {}
  }

  var estado = {
    bateria: 87,
    compart: 0,
    onde: "base",          // base | A | C (ultimo ponto onde parou)
    destino: null,
    fase: "parado",        // parado | andando | descarregando
    rota: null, segs: null, total: 0, andado: 0,
    yaw: 0,
    velocidade: 0,
    de: "base"
  };

  var VEL = 5.2;           // unidades por segundo (visual)
  var VEL_REAL = 0.5;      // m/s mostrado

  function el(id) { return document.getElementById(id); }
  var E = {
    status: el("status"),
    hudLocal: el("hudLocal"),
    dEstado: el("dEstado"), dAlvo: el("dAlvo"),
    barraTrajeto: el("barraTrajeto"), dProgresso: el("dProgresso"),
    dBateria: el("dBateria"), barraBateria: el("barraBateria"), dBateriaInfo: el("dBateriaInfo"),
    dCompart: el("dCompart"), barraCompart: el("barraCompart"), dCompartInfo: el("dCompartInfo"),
    dKg: el("dKg"), dItens: el("dItens"), dDist: el("dDist"), dVel: el("dVel"),
    dCentralC: el("dCentralC"), dCentralA: el("dCentralA"),
    btnC: el("btnCentralC"), btnA: el("btnCentralA"), btnBase: el("btnBase"),
    btnSeguir: el("btnSeguir"), btnGeral: el("btnVisaoGeral"), btnRaioX: el("btnRaioX")
  };

  function fmt(n, casas) {
    return n.toFixed(casas).replace(".", ",");
  }
  function pluralItens(n) { return n + (n === 1 ? " item" : " itens"); }

  /* ---------- Onde o robo esta (texto) ---------- */
  function localAtual() {
    var p = robo.position;
    if (estado.fase !== "andando" && estado.onde === "base" && p.distanceTo(BASE) < 1) {
      return "Base · Prédio E";
    }
    if (Math.abs(p.x - RAMPA.x) < RAMPA.larg / 2 + 0.2 && p.z < RAMPA.zBaixo && p.z > RAMPA.zAlto && p.y > 0.05) {
      return "Rampa de acesso";
    }
    var ordem = ["D", "C", "A", "B", "E"];
    for (var i = 0; i < ordem.length; i++) {
      var b = PREDIOS.filter(function (q) { return q.id === ordem[i]; })[0];
      if (p.x >= b.x1 && p.x <= b.x2 && p.z >= b.z1 && p.z <= b.z2) {
        if (b.id === "D") return p.y > H - 0.2 ? "Prédio D" : "Pátio";
        if (b.andares > 1) {
          var andar = Math.floor((p.y + 0.15) / H) + 1;
          return "Prédio " + b.id + " · " + (andar === 1 ? "térreo" : andar + "º andar");
        }
        return "Prédio " + b.id;
      }
    }
    return "Pátio / área externa";
  }

  /* ---------- Atualiza todos os numeros na tela ---------- */
  function atualizarPainel() {
    var bat = Math.max(0, Math.min(100, estado.bateria));
    E.dBateria.textContent = Math.round(bat) + "%";
    E.barraBateria.style.width = bat + "%";
    E.barraBateria.className = bat < 20 ? "baixa" : bat < 45 ? "media" : "";
    var carregando = estado.fase === "parado" && estado.onde === "base";
    E.dBateriaInfo.textContent = carregando
      ? (bat >= 100 ? "Carga completa" : "Carregando na base")
      : "Em uso";

    var comp = Math.max(0, Math.min(100, estado.compart));
    E.dCompart.textContent = Math.round(comp) + "%";
    E.barraCompart.style.width = comp + "%";
    E.barraCompart.className = comp > 85 ? "cheio" : "";
    E.dCompartInfo.textContent = comp < 1 ? "Vazio"
      : comp > 85 ? "Quase cheio" : "Carregando resíduos";

    E.dKg.textContent = fmt(dados.kg, 1) + " kg";
    E.dItens.textContent = pluralItens(dados.itens);
    E.dDist.textContent = Math.round(dados.dist * ESCALA_M) + " m";
    E.dVel.textContent = fmt(estado.velocidade, 1) + " m/s";
    E.dCentralC.textContent = pluralItens(dados.centralC);
    E.dCentralA.textContent = pluralItens(dados.centralA);

    var local = localAtual();
    E.hudLocal.textContent = local;

    // Estado
    var texto, etiq, prog, status;
    if (estado.fase === "andando") {
      var restante = Math.max(0, estado.total - estado.andado) * ESCALA_M;
      var voltando = estado.destino === "base";
      texto = voltando ? "Retornando" : "A caminho";
      etiq = "Destino: " + NOMES[estado.destino];
      prog = "Faltam ~" + Math.round(restante) + " m";
      status = voltando ? "Voltando para a base..." : "Indo para a " + NOMES[estado.destino] + "...";
    } else if (estado.fase === "descarregando") {
      texto = "Descarregando";
      etiq = NOMES[estado.onde];
      prog = "Depositando resíduos";
      status = "Descarregando na " + NOMES[estado.onde] + "...";
    } else {
      texto = estado.onde === "base" ? "Na base" : "Na " + NOMES[estado.onde];
      etiq = "Sem destino";
      prog = "Aguardando comando";
      status = estado.onde === "base" ? "Robô na base" : "Robô na " + NOMES[estado.onde];
    }
    E.dEstado.textContent = texto;
    E.dAlvo.textContent = etiq;
    E.dProgresso.textContent = prog;
    E.barraTrajeto.style.width = estado.fase === "andando" && estado.total > 0
      ? Math.min(100, (estado.andado / estado.total) * 100) + "%"
      : "0%";
    if (E.status.textContent !== status) E.status.textContent = status;
    E.status.className = "status" + (estado.fase === "andando" ? " chamando" : estado.fase === "descarregando" ? " chamando" : "");

    // Botoes
    var ocupado = estado.fase !== "parado";
    E.btnC.disabled = ocupado || estado.onde === "C";
    E.btnA.disabled = ocupado || estado.onde === "A";
    E.btnBase.disabled = ocupado || estado.onde === "base";
    E.btnC.classList.toggle("alvo", estado.destino === "C" && ocupado);
    E.btnA.classList.toggle("alvo", estado.destino === "A" && ocupado);
    E.btnBase.classList.toggle("alvo", estado.destino === "base" && ocupado);
  }

  /* ---------- Rotas ---------- */
  function montarRota(de, para) {
    var ida = ROTAS[de].slice().reverse();   // de -> base
    var vinda = ROTAS[para];                 // base -> para
    var pts = ida.concat(vinda.slice(1));
    // remove pontos duplicados
    var limpo = [pts[0].clone()];
    for (var i = 1; i < pts.length; i++) {
      if (pts[i].distanceTo(limpo[limpo.length - 1]) > 0.01) limpo.push(pts[i].clone());
    }
    return limpo;
  }

  function iniciarViagem(para) {
    if (estado.fase !== "parado" || para === estado.onde) return;
    var rota = montarRota(estado.onde, para);
    if (rota.length < 2) return;

    // ao sair para uma central o robo leva o que coletou
    if (para !== "base" && estado.compart < 30) {
      estado.compart = 55 + Math.round(Math.random() * 40);
    }

    estado.rota = rota;
    estado.segs = [];
    estado.total = 0;
    for (var i = 1; i < rota.length; i++) {
      var d = rota[i].distanceTo(rota[i - 1]);
      estado.segs.push(d);
      estado.total += d;
    }
    estado.andado = 0;
    estado.destino = para;
    estado.de = estado.onde;
    estado.fase = "andando";
    estado.velocidade = VEL_REAL;
    mostrarTrilha(rota);
    atualizarPainel();
  }

  function chegou() {
    var para = estado.destino;
    estado.velocidade = 0;
    limparTrilha();
    estado.onde = para;

    if (para === "base") {
      estado.fase = "parado";
      estado.destino = null;
      atualizarPainel();
      return;
    }

    // Descarrega na central
    estado.fase = "descarregando";
    var itens = Math.max(1, Math.round(estado.compart * 0.55));
    var inicio = estado.compart;
    var duracao = 3200;
    var t0 = performance.now();
    atualizarPainel();

    (function passo() {
      var k = Math.min(1, (performance.now() - t0) / duracao);
      estado.compart = inicio * (1 - k);
      if (k < 1) {
        requestAnimationFrame(passo);
        return;
      }
      estado.compart = 0;
      dados.itens += itens;
      dados.kg += itens * 0.045;
      if (para === "A") dados.centralA += itens; else dados.centralC += itens;
      salvarDados();
      estado.fase = "parado";
      estado.destino = null;
      atualizarPainel();
    })();
  }

  E.btnC.addEventListener("click", function () { iniciarViagem("C"); });
  E.btnA.addEventListener("click", function () { iniciarViagem("A"); });
  E.btnBase.addEventListener("click", function () { iniciarViagem("base"); });


  /* ---------- Salvar / restaurar posicao do robo ---------- */
  var CHAVE_ESTADO = "monitorRobo.estado";
  function salvarEstado() {
    try {
      localStorage.setItem(CHAVE_ESTADO, JSON.stringify({
        onde: estado.onde, de: estado.de, destino: estado.destino,
        fase: estado.fase === "descarregando" ? "parado" : estado.fase,
        andado: estado.andado, yaw: estado.yaw,
        bateria: estado.bateria, compart: estado.compart
      }));
    } catch (e) {}
  }
  function restaurarEstado() {
    try {
      var r = JSON.parse(localStorage.getItem(CHAVE_ESTADO) || "null");
      if (!r || typeof r !== "object" || !ROTAS[r.onde]) return;
      estado.onde = r.onde;
      if (typeof r.bateria === "number") estado.bateria = r.bateria;
      if (typeof r.compart === "number") estado.compart = r.compart;
      if (typeof r.yaw === "number") { estado.yaw = r.yaw; robo.rotation.y = r.yaw; }
      var rt = ROTAS[r.onde];
      robo.position.copy(rt[rt.length - 1]);
      if (r.fase === "andando" && ROTAS[r.de] && ROTAS[r.destino] && r.de !== r.destino) {
        var rota = montarRota(r.de, r.destino);
        estado.rota = rota; estado.segs = []; estado.total = 0;
        for (var i = 1; i < rota.length; i++) {
          var d = rota[i].distanceTo(rota[i - 1]);
          estado.segs.push(d); estado.total += d;
        }
        estado.andado = Math.max(0, Math.min(estado.total, r.andado || 0));
        estado.de = r.de; estado.destino = r.destino; estado.fase = "andando";
        estado.velocidade = VEL_REAL;
        var p = posicaoNaRota(estado.andado);
        if (p) robo.position.copy(p.pos);
        mostrarTrilha(rota);
      }
    } catch (e) {}
  }

  /* ---------- Camera: seguir, visao geral, raio-x ---------- */
  var seguir = false;
  function marcarSeguir() { E.btnSeguir.classList.toggle("ativo", seguir); }
  E.btnSeguir.addEventListener("click", function () { seguir = !seguir; marcarSeguir(); });
  E.btnGeral.addEventListener("click", function () {
    seguir = false; marcarSeguir();
    animarCamera = { t: 0, de: camera.position.clone(), deAlvo: controles.target.clone() };
  });
  var animarCamera = null;

  var raioX = true;
  function aplicarRaioX() {
    materiaisParedes.forEach(function (m) { m.opacity = raioX ? 0.32 : 0.92; });
    materiaisLajes.forEach(function (m) { m.opacity = raioX ? 0.35 : 0.0; });
    E.btnRaioX.classList.toggle("ativo", raioX);
  }
  E.btnRaioX.addEventListener("click", function () { raioX = !raioX; aplicarRaioX(); });
  aplicarRaioX();
  marcarSeguir();

  /* ---------- Tamanho do canvas ---------- */
  function ajustar() {
    var w = contenedor.clientWidth, h = contenedor.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(ajustar).observe(contenedor);
  window.addEventListener("resize", ajustar);
  ajustar();

  /* ---------- Laco de animacao ---------- */
  var relogio = new THREE.Clock();
  var contaPainel = 0, contaSalvar = 0;
  var tmpDir = new THREE.Vector3();

  function posicaoNaRota(dist) {
    var acum = 0;
    for (var i = 0; i < estado.segs.length; i++) {
      var s = estado.segs[i];
      if (dist <= acum + s || i === estado.segs.length - 1) {
        var k = s > 0 ? Math.min(1, (dist - acum) / s) : 1;
        var a = estado.rota[i], b = estado.rota[i + 1];
        tmpDir.subVectors(b, a);
        return { pos: a.clone().lerp(b, k), dir: tmpDir.clone() };
      }
      acum += s;
    }
    return null;
  }

  function lerpAngulo(a, b, t) {
    var d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    return a + d * t;
  }

  function frame() {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, relogio.getDelta());
    var tempo = relogio.elapsedTime;

    // Movimento do robo
    if (estado.fase === "andando") {
      estado.andado = Math.min(estado.total, estado.andado + VEL * dt);
      var r = posicaoNaRota(estado.andado);
      if (r) {
        robo.position.copy(r.pos);
        var hdist = Math.sqrt(r.dir.x * r.dir.x + r.dir.z * r.dir.z);
        if (hdist > 0.001) {
          var yawAlvo = Math.atan2(r.dir.x, r.dir.z);
          estado.yaw = lerpAngulo(estado.yaw, yawAlvo, Math.min(1, dt * 8));
          robo.rotation.y = estado.yaw;
        }
        var inclina = -Math.atan2(r.dir.y, Math.max(hdist, 0.001));
        robo.rotation.x += (inclina - robo.rotation.x) * Math.min(1, dt * 8);
      }
      dados.dist += VEL * dt;
      estado.bateria -= 0.3 * dt;   // gasta com o movimento
      contaPainel += dt;
      if (estado.andado >= estado.total) {
        robo.rotation.x = 0;
        salvarDados();
        chegou();
      }
    } else {
      robo.rotation.x += (0 - robo.rotation.x) * Math.min(1, dt * 6);
      if (estado.onde === "base" && estado.fase === "parado") {
        estado.bateria = Math.min(100, estado.bateria + 1.6 * dt);   // carregando
      } else {
        estado.bateria -= 0.01 * dt;                                  // consumo parado
      }
    }
    estado.bateria = Math.max(0, Math.min(100, estado.bateria));

    // Luz de status
    robo.userData.luz.material.color.set(
      estado.fase === "andando" ? 0xfacc15 : estado.fase === "descarregando" ? 0xfb923c : 0x4ade80
    );

    // Marcador e sombra seguem o robo
    marcador.position.set(robo.position.x, robo.position.y, robo.position.z);
    pinoGrupo.position.y = 2.2 + Math.sin(tempo * 3) * 0.25;
    var pulso = (tempo % 1.4) / 1.4;
    anelRobo.position.y = 0.12;
    anelRobo.scale.setScalar(0.8 + pulso * 1.6);
    anelRobo.material.opacity = 0.85 * (1 - pulso);
    sombra.position.set(robo.position.x, robo.position.y + 0.06, robo.position.z);

    // Destaque da central de destino
    Object.keys(centraisObj).forEach(function (k) {
      var o = centraisObj[k];
      var alvo = estado.destino === k && estado.fase === "andando";
      if (alvo) {
        o.anel.material.opacity = 0.9 * (1 - pulso);
        o.anel.scale.setScalar(0.8 + pulso * 0.6);
        o.topo.scale.setScalar(1 + Math.sin(tempo * 6) * 0.25);
      } else {
        o.anel.material.opacity = 0;
        o.topo.scale.setScalar(1);
      }
    });

    // Camera
    if (animarCamera) {
      animarCamera.t = Math.min(1, animarCamera.t + dt * 1.6);
      var e = 1 - Math.pow(1 - animarCamera.t, 3);
      camera.position.lerpVectors(animarCamera.de, VISAO_GERAL.pos, e);
      controles.target.lerpVectors(animarCamera.deAlvo, VISAO_GERAL.alvo, e);
      if (animarCamera.t >= 1) animarCamera = null;
    } else if (seguir) {
      var dx = robo.position.x - controles.target.x;
      var dy = robo.position.y - controles.target.y;
      var dz = robo.position.z - controles.target.z;
      var f = Math.min(1, dt * 3);
      controles.target.x += dx * f; controles.target.y += dy * f; controles.target.z += dz * f;
      camera.position.x += dx * f; camera.position.y += dy * f; camera.position.z += dz * f;
    }
    controles.update();

    contaSalvar += dt;
    if (contaSalvar > 0.4) { contaSalvar = 0; salvarEstado(); }

    // Painel (a ~10x por segundo)
    contaPainel += dt;
    if (contaPainel > 0.1) {
      contaPainel = 0;
      atualizarPainel();
    }

    renderer.render(cena, camera);
  }

  window.addEventListener("pagehide", salvarEstado);
  restaurarEstado();
  atualizarPainel();
  frame();
})();
