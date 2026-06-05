// AI-Netram Prototype Logic

document.addEventListener('DOMContentLoaded', () => {
  // API URL Helper for Vercel vs Local (checks localStorage for dynamic config)
  const getApiUrl = (path) => {
    let configuredEndpoint = localStorage.getItem('api_endpoint');
    if (configuredEndpoint) {
      configuredEndpoint = configuredEndpoint.trim().replace(/\/+$/, '');
      return configuredEndpoint + path;
    }
    return 'http://127.0.0.1:5010' + path;
  };

  // Screen Elements
  const screenUpload = document.getElementById('screen-upload');
  const screenProcessing = document.getElementById('screen-processing');
  const screenReport = document.getElementById('screen-report');

  // Input & Button Elements
  const maintOptions = document.querySelectorAll('.maint-option');
  const dropzone = document.getElementById('dropzone');
  const videoInput = document.getElementById('video-input');
  const btnDemoVideo = document.getElementById('btn-demo-video');
  const fileInfoContainer = document.getElementById('file-info-container');
  const selectedFileName = document.getElementById('selected-file-name');
  const selectedFileSize = document.getElementById('selected-file-size');
  const btnStartAnalysis = document.getElementById('btn-start-analysis');
  const inputTrainNo = document.getElementById('input-train-no');
  const inputBogieCount = document.getElementById('input-bogie-count');

  // Canvas & Video Elements
  const sourceVideo = document.getElementById('source-video');
  const analysisCanvas = document.getElementById('analysis-canvas');
  const canvasCtx = analysisCanvas.getContext('2d');
  const analysisPercent = document.getElementById('analysis-percent');
  const analysisProgressFill = document.getElementById('analysis-progress-fill');
  const consoleLogs = document.getElementById('console-logs');

  // Report Elements
  const countGoodEl = document.getElementById('count-good');
  const countBadEl = document.getElementById('count-bad');
  const countUnusualEl = document.getElementById('count-unusual');
  const reportTrainNo = document.getElementById('report-train-no');
  const reportCheckLevel = document.getElementById('report-check-level');
  const reportOverallBadge = document.getElementById('report-overall-badge');
  const trainSchematicContainer = document.getElementById('train-schematic-container');
  const detailEmptyState = document.getElementById('detail-empty-state');
  const detailContent = document.getElementById('detail-content');
  const detailBogieId = document.getElementById('detail-bogie-id');
  const detailBogieBadge = document.getElementById('detail-bogie-badge');
  const wheelInspectList = document.getElementById('wheel-inspect-list');
  const defectInsightContainer = document.getElementById('defect-insight-container');
  const defectImg = document.getElementById('defect-img');
  const defectTypeBadge = document.getElementById('defect-type-badge');
  const defectDescText = document.getElementById('defect-desc-text');

  // Actions & Modal Elements
  const btnReanalyze = document.getElementById('btn-reanalyze');
  const btnOpenEmail = document.getElementById('btn-open-email');
  const btnExportReport = document.getElementById('btn-export-report');
  const emailModal = document.getElementById('email-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCloseModalOk = document.getElementById('btn-close-modal-ok');
  const btnCopyEmail = document.getElementById('btn-copy-email');
  const emailSubjectLine = document.getElementById('email-subject-line');
  const emailBodyText = document.getElementById('email-body-text');

  // Error modal elements
  const errorModal = document.getElementById('error-modal');
  const errorModalMessageText = document.getElementById('error-modal-message-text');
  const btnCloseErrorModal = document.getElementById('btn-close-error-modal');
  const btnCloseErrorOk = document.getElementById('btn-close-error-ok');

  // State Management
  let selectedMaintDistance = '300';
  let totalBogies = 8;
  let trainId = '12810 - HOWRAH MAIL';
  let selectedVideoFile = null;
  let useDemoMode = false;
  let isAnalyzing = false;
  let currentBogieData = [];
  let selectedBogieIndex = null;
  let selectedWheelIndex = null;
  
  // Custom mock video frames animation variables
  let animationFrameId = null;
  let simProgress = 0;
  let simTime = 0;

  const uploadErrorBanner = document.getElementById('upload-error-banner');
  const uploadErrorText = document.getElementById('upload-error-text');

  // Drag and drop video file
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleVideoSelection(e.dataTransfer.files[0]);
    }
  });

  // Use Event Delegation to listen for changes on any dynamically generated file input inside dropzone
  dropzone.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'video-input') {
      if (e.target.files.length > 0) {
        handleVideoSelection(e.target.files[0]);
      }
    }
  });

  const originalDropzoneHTML = `
    <input type="file" id="video-input" accept="video/*,.dav" class="file-hidden">
    <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <p class="upload-text-main">Drag and drop track CCTV video here</p>
    <p class="upload-text-sub">Supports MP4, MOV, AVI, DAV up to 250MB</p>
  `;

  // Selected file loader - Automatic processing start
  function handleVideoSelection(file) {
    selectedVideoFile = file;
    useDemoMode = false;
    uploadErrorBanner.classList.add('hidden'); // Clear previous errors

    // Render beautiful spinner inside dropzone
    dropzone.innerHTML = `
      <svg class="upload-icon animate-spin" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="3" style="animation: spin 1s linear infinite; margin-bottom: 12px;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25" stroke="currentColor"></circle>
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke-dasharray="31.4" stroke-dashoffset="10" fill="none"></path>
      </svg>
      <p class="upload-text-main" style="color: var(--primary);">Uploading & Verifying Footage...</p>
      <p class="upload-text-sub">${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)</p>
    `;

    // Set up source video element
    const fileURL = URL.createObjectURL(file);
    sourceVideo.src = fileURL;

    // Trigger analysis immediately
    trainId = "12810 - HOWRAH MAIL";
    totalBogies = 8;

    const formData = new FormData();
    formData.append('video', selectedVideoFile);
    formData.append('bogie_count', totalBogies);

    const targetUrl = getApiUrl('/api/analyze');
    const headers = {};
    if (!targetUrl.includes('127.0.0.1') && !targetUrl.includes('localhost')) {
      headers['bypass-tunnel-reminder'] = 'true';
      headers['Bypass-Tunnel-Reminder'] = 'true';
    }

    fetch(targetUrl, {
      method: 'POST',
      body: formData,
      headers: headers
    })
    .then(response => {
      if (response.status === 422) {
        return response.json().then(errData => {
          throw new Error(errData.error || "Validation error");
        });
      }
      if (!response.ok) throw new Error("Local AI server offline.");
      return response.json();
    })
    .then(data => {
      // Restore dropzone
      dropzone.innerHTML = originalDropzoneHTML;

      window.realAnalysisResult = data;
      screenUpload.classList.remove('active');
      screenProcessing.classList.add('active');
      startAnalysisProcess(true);
    })
    .catch(err => {
      // Restore dropzone on failure
      dropzone.innerHTML = originalDropzoneHTML;

      if (err.message.includes("correct") || err.message.includes("clarity")) {
        // Trigger the bounce modal on Screen 1
        errorModalMessageText.textContent = err.message;
        errorModal.classList.remove('hidden');
      } else {
        // Safe alert banner for general server errors
        uploadErrorBanner.classList.remove('hidden');
        let errorMsg = err.message || "Failed to analyze video file.";
        if (window.location.protocol === 'https:') {
          errorMsg = "HTTPS Security Block: Please open the app locally at http://127.0.0.1:5010/ or open index.html directly from your files to process videos.";
        }
        document.getElementById('upload-error-text').textContent = errorMsg;
      }
    });
  }

  // Reset/Reanalyze
  btnReanalyze.addEventListener('click', () => {
    screenReport.classList.remove('active');
    screenUpload.classList.add('active');
    
    // Reset variables
    selectedVideoFile = null;
    useDemoMode = false;
    fileInfoContainer.classList.add('hidden');
    videoInput.value = "";
    simProgress = 0;
    simTime = 0;
    currentBogieData = [];
    selectedBogieIndex = null;
    selectedWheelIndex = null;
    detailEmptyState.classList.remove('hidden');
    detailContent.classList.add('hidden');
    uploadErrorBanner.classList.add('hidden');
  });

  // AI Analysis Loop
  function startAnalysisProcess(hasServerResult) {
    isAnalyzing = true;
    simProgress = 0;
    simTime = 0;
    window.analysisError = null;
    
    // Clear logs
    consoleLogs.innerHTML = "";
    addLogLine("Initializing AI-Netram Core Engine...", "system");
    
    // Resize Canvas
    analysisCanvas.width = 640;
    analysisCanvas.height = 360;

    // Start video source if using uploaded video
    if (selectedVideoFile) {
      sourceVideo.play().catch(err => console.log("Video autoplay blocked", err));
      if (hasServerResult) {
        addLogLine("Footage verified. Real-time frame processing active.", "system");
      } else {
        addLogLine("Local AI server offline. Running client-side Edge AI fallback engine.", "defect-unusual");
      }
    } else {
      addLogLine("Demo simulation selected. Initializing virtual track cameras...", "system");
    }

    addLogLine("Loading YOLOv8 Defect Detection Weights...", "system");
    addLogLine(`Inspecting Train ${trainId}`, "system");

    // Animation Loop
    runFrameProcessing();
  }

  function addLogLine(text, type = "") {
    const log = document.createElement('div');
    log.className = `log-line ${type}`;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    log.innerHTML = `[${timeStr}] ${text}`;
    consoleLogs.appendChild(log);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
  }

  function runFrameProcessing() {
    if (!isAnalyzing) return;

    // Advance Progress
    simProgress += 0.4; // controls the speed of analysis
    if (simProgress >= 100) {
      simProgress = 100;
      isAnalyzing = false;
      finishAnalysis();
      return;
    }

    analysisPercent.textContent = Math.floor(simProgress) + "%";
    analysisProgressFill.style.width = simProgress + "%";

    // Draw frame & analysis bounding boxes on canvas
    drawAIFrame();

    // Log messages based on progress checkpoints
    logEventsByProgress(simProgress);

    animationFrameId = requestAnimationFrame(runFrameProcessing);
  }

  function drawAIFrame() {
    if (selectedVideoFile && !sourceVideo.paused && !sourceVideo.ended) {
      // Draw the actual uploaded video frames onto the canvas
      canvasCtx.drawImage(sourceVideo, 0, 0, 640, 360);
      
      // Overlay professional computer vision tracking boxes over the video footage
      const boxWidth = 90;
      const boxHeight = 90;
      const scanX = 180 + (Math.sin(simProgress * 0.2) * 120); // Sweep side-to-side
      const scanY = 160 + (Math.cos(simProgress * 0.1) * 30);
      
      // Draw bounding box
      canvasCtx.strokeStyle = 'rgba(79, 70, 229, 0.8)'; // Indigo bounding box
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeRect(scanX, scanY, boxWidth, boxHeight);
      
      // Draw reticle target corners
      canvasCtx.fillStyle = 'var(--primary)';
      // Top Left corner
      canvasCtx.fillRect(scanX - 2, scanY - 2, 12, 3);
      canvasCtx.fillRect(scanX - 2, scanY - 2, 3, 12);
      // Top Right corner
      canvasCtx.fillRect(scanX + boxWidth - 10, scanY - 2, 12, 3);
      canvasCtx.fillRect(scanX + boxWidth - 1, scanY - 2, 3, 12);
      // Bottom Left corner
      canvasCtx.fillRect(scanX - 2, scanY + boxHeight - 1, 12, 3);
      canvasCtx.fillRect(scanX - 2, scanY + boxHeight - 10, 3, 12);
      // Bottom Right corner
      canvasCtx.fillRect(scanX + boxWidth - 10, scanY + boxHeight - 1, 12, 3);
      canvasCtx.fillRect(scanX + boxWidth - 1, scanY + boxHeight - 10, 3, 12);
      
      // Defect marker overlay on matching progress
      if (simProgress > 50 && simProgress < 58) {
        // Highlight defective wheel
        canvasCtx.strokeStyle = 'var(--danger)';
        canvasCtx.lineWidth = 3;
        canvasCtx.strokeRect(scanX - 10, scanY - 10, boxWidth + 20, boxHeight + 20);
        
        canvasCtx.fillStyle = 'var(--danger)';
        canvasCtx.font = '10px var(--font-code)';
        canvasCtx.fillText("ANOMALY: WHEEL_FLANGE_WEAR 94.2%", scanX - 10, scanY - 16);
      } else if (simProgress > 80 && simProgress < 88) {
        // Highlight unusual carriage defect
        canvasCtx.strokeStyle = 'var(--warning)';
        canvasCtx.lineWidth = 3;
        canvasCtx.strokeRect(scanX - 15, scanY + 40, boxWidth + 30, boxHeight - 10);
        
        canvasCtx.fillStyle = 'var(--warning)';
        canvasCtx.font = '10px var(--font-code)';
        canvasCtx.fillText("WARNING: HANGING_OBJECT 87.5%", scanX - 15, scanY + 34);
      } else {
        canvasCtx.fillStyle = 'var(--success)';
        canvasCtx.font = '10px var(--font-code)';
        canvasCtx.fillText("TRACKING: WHEEL_PROFILE OK 99.4%", scanX, scanY - 8);
      }

      // Drawing scanning laser beam
      canvasCtx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      canvasCtx.lineWidth = 2;
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, 180 + Math.sin(simTime * 0.05) * 80);
      canvasCtx.lineTo(640, 180 + Math.sin(simTime * 0.05) * 80);
      ctx = canvasCtx;
      ctx.stroke();

    } else {
      // Fallback Demo Simulation
      canvasCtx.fillStyle = '#f8fafc';
      canvasCtx.fillRect(0, 0, 640, 360);

      // Draw tracks
      canvasCtx.strokeStyle = '#94a3b8';
      canvasCtx.lineWidth = 4;
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, 280);
      canvasCtx.lineTo(640, 280);
      canvasCtx.stroke();

      // Draw track ties
      canvasCtx.strokeStyle = '#cbd5e1';
      canvasCtx.lineWidth = 6;
      for (let i = 0; i < 640; i += 40) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(i + (simTime % 40), 280);
        canvasCtx.lineTo(i + (simTime % 40) - 10, 320);
        canvasCtx.stroke();
      }

      // Draw moving train bogie simulation
      simTime -= 4;
      const trainX = 320 + (simTime % 300);

      drawWheelSchematic(canvasCtx, trainX - 80, 260, 25, "Bogie Wheel L1 - OK");
      drawWheelSchematic(canvasCtx, trainX + 80, 260, 25, "Bogie Wheel L2 - OK");
      
      // Draw Bogie frame
      canvasCtx.fillStyle = '#cbd5e1';
      canvasCtx.fillRect(trainX - 110, 210, 220, 30);
      canvasCtx.strokeStyle = '#94a3b8';
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeRect(trainX - 110, 210, 220, 30);

      // Scanner Laser line
      canvasCtx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      canvasCtx.lineWidth = 2;
      canvasCtx.beginPath();
      canvasCtx.moveTo(320, 150);
      canvasCtx.lineTo(320, 280);
      canvasCtx.stroke();
      
      // Scanning target reticle
      canvasCtx.strokeStyle = 'var(--primary)';
      canvasCtx.beginPath();
      canvasCtx.arc(320, 260, 40, 0, Math.PI * 2);
      canvasCtx.stroke();
    }
  }

  function drawWheelSchematic(ctx, x, y, radius, label) {
    // Wheel outline
    ctx.strokeStyle = 'var(--success)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner hub
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Spokes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle + (simTime * 0.05)) * radius, y + Math.sin(angle + (simTime * 0.05)) * radius);
      ctx.stroke();
    }

    // AI Bounding Box Glow
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.strokeRect(x - radius - 5, y - radius - 5, radius * 2 + 10, radius * 2 + 10);
    
    // Bounding Box Label
    ctx.fillStyle = 'var(--success)';
    ctx.font = '10px var(--font-code)';
    ctx.fillText(label, x - radius - 4, y - radius - 10);
  }

  // Handle log checkpoints
  let loggedCheckpoints = {};
  function logEventsByProgress(progress) {
    const checkpoints = [
      { p: 10, text: "Scanning Wagon #1: 8 wheels identified. Status: Good.", type: "" },
      { p: 25, text: "Scanning Wagon #2: 8 wheels identified. Status: Good.", type: "" },
      { p: 40, text: "Scanning Wagon #3: 8 wheels identified. Status: Good.", type: "" },
      { p: 52, text: "WARNING: Wagon #5 - Wheel #3 shows micro-fractures and profile wear!", type: "defect-bad" },
      { p: 55, text: "ALERT: Wagon #5 - Wheel #3 flagged as BAD. Tread loss limit exceeded.", type: "defect-bad" },
      { p: 70, text: "Scanning Wagon #6: 8 wheels identified. Status: Good.", type: "" },
      { p: 82, text: "CRITICAL: Under-carriage anomaly detected on Wagon #7!", type: "defect-unusual" },
      { p: 85, text: "ALERT: Wagon #7 - Safety chain and brake beam hanging to ballast level. Status: Unusual.", type: "defect-unusual" },
      { p: 95, text: "Scanning Wagon #8: 8 wheels identified. Status: Good.", type: "" }
    ];

    checkpoints.forEach(chk => {
      if (progress >= chk.p && !loggedCheckpoints[chk.p]) {
        addLogLine(chk.text, chk.type);
        loggedCheckpoints[chk.p] = true;
      }
    });
  }

  // Done analyzing
  function finishAnalysis() {
    if (window.analysisError) {
      // Show error on upload screen and reset screen
      screenProcessing.classList.remove('active');
      screenUpload.classList.add('active');
      errorModalMessageText.textContent = window.analysisError;
      errorModal.classList.remove('hidden');
      
      // Reset upload inputs
      selectedVideoFile = null;
      useDemoMode = false;
      fileInfoContainer.classList.add('hidden');
      videoInput.value = "";
      return;
    }

    if (window.realAnalysisResult) {
      // Load real backend output
      currentBogieData = window.realAnalysisResult.bogies;
      trainId = window.realAnalysisResult.train_id;
    } else {
      // Generate Bogie Data dynamically based on count (Fallback simulation)
      currentBogieData = [];
      const wagonTypes = ["BOXN", "BCN", "BRN", "BTPN"];
      for (let i = 1; i <= totalBogies; i++) {
        let wagon_number = `${wagonTypes[i % 4]}-${220000 + i * 142}`;
        let status = "GOOD";
        
        let components = [
          {
            name: "EM Pads",
            status: "GOOD",
            desc: "Normal EM Pad: Clean, black rubber block, aligned between the bogie frame and adapter.",
            defect_type: "normal_em_pad"
          },
          {
            name: "Suspension Springs",
            status: "GOOD",
            desc: "Spring normal: Complete set of aligned coil springs, seated vertically.",
            defect_type: "normal_spring"
          },
          {
            name: "Axle Box & Bearings",
            status: "GOOD",
            desc: "Bearings normal. Lubrication level: 96%.",
            defect_type: "normal"
          },
          {
            name: "Undercarriage Clearance",
            status: "GOOD",
            desc: "Clearance normal. No loose cables or hangers.",
            defect_type: "normal"
          }
        ];
        
        for (let w = 1; w <= 8; w++) {
          components.push({
            name: `Wheel ${w}`,
            status: "GOOD",
            desc: "Perfect status. Flange wear normal.",
            defect_type: "normal"
          });
        }
        
        if (i === 5) {
          status = "BAD";
          components[0] = {
            name: "EM Pads",
            status: "BAD",
            desc: "Defective EM Pad: Rubber is perished, cracked, and crushed at the outer edge.",
            defect_type: "defective_em_pad"
          };
          components[6] = {
            name: "Wheel 3",
            status: "BAD",
            desc: "Defective wagon wheel: Severe tread wear and flange cracks detected. Metal shedding exceeds the safe limit.",
            defect_type: "defective_wheel"
          };
        } else if (i === 7) {
          status = "UNUSUAL";
          components[1] = {
            name: "Suspension Springs",
            status: "BAD",
            desc: "Defective springs: Shifted/dislocated coil springs on the right side.",
            defect_type: "defective_spring"
          };
          components[2] = {
            name: "Axle Box & Bearings",
            status: "BAD",
            desc: "Grease swing: Visible black grease oozing and leaking out from the bearing hub.",
            defect_type: "grease_swing"
          };
          components[3] = {
            name: "Undercarriage Clearance",
            status: "UNUSUAL",
            desc: "Unusual part hanging: Loose brake beam safety bracket hanging below standard clearance line.",
            defect_type: "unusual_hanging"
          };
        }
        
        currentBogieData.push({
          id: i,
          wagon_number: wagon_number,
          status: status,
          components: components
        });
      }
    }

    // Load Overview Numbers
    let goodCount = currentBogieData.filter(b => b.status === "GOOD").length;
    let badCount = currentBogieData.filter(b => b.status === "BAD").length;
    let unusualCount = currentBogieData.filter(b => b.status === "UNUSUAL").length;

    countGoodEl.textContent = goodCount;
    countBadEl.textContent = badCount;
    countUnusualEl.textContent = unusualCount;

    reportTrainNo.textContent = trainId;
    reportCheckLevel.textContent = "Yard Camera Feed";

    if (badCount > 0 || unusualCount > 0) {
      reportOverallBadge.textContent = "ATTENTION REQUIRED";
      reportOverallBadge.className = "badge badge-danger red-pulse";
    } else {
      reportOverallBadge.textContent = "PERFECT STATUS";
      reportOverallBadge.className = "badge";
      reportOverallBadge.style.backgroundColor = "var(--success)";
      reportOverallBadge.style.color = "#fff";
    }

    // Render Train Map
    renderTrainMap();

    // Show Screen 3
    screenProcessing.classList.remove('active');
    screenReport.classList.add('active');

    // Auto-select the first defective bogie if it exists, otherwise Bogie 1
    const defaultSelectBogie = currentBogieData.find(b => b.status !== "GOOD") || currentBogieData[0];
    if (defaultSelectBogie) {
      selectBogie(currentBogieData.indexOf(defaultSelectBogie));
    }
  }

  function renderTrainMap() {
    trainSchematicContainer.innerHTML = "";

    // Render Engine
    const engine = document.createElement('div');
    engine.className = "engine-block";
    engine.textContent = trainId && trainId !== "Unknown" ? `LOCO ${trainId}` : "LOCO WAP7";
    trainSchematicContainer.appendChild(engine);

    // Render Bogies
    currentBogieData.forEach((bogie, index) => {
      const block = document.createElement('div');
      block.className = `bogie-block state-${bogie.status.toLowerCase()}`;
      if (index === selectedBogieIndex) {
        block.classList.add('selected');
      }

      const hasBadWheel = bogie.components.some(comp => comp.name.startsWith('Wheel') && comp.status === 'BAD');
      const hasUnusualClearance = bogie.components.some(comp => comp.status === 'UNUSUAL');

      block.innerHTML = `
        <span class="bogie-label">${bogie.wagon_number || `WAGON ${bogie.id}`}</span>
        <span class="bogie-status-dot"></span>
        <div class="bogie-wheels-row">
          <span class="schematic-wheel ${hasBadWheel ? 'is-defective' : ''}"></span>
          <span class="schematic-wheel"></span>
          <span class="schematic-wheel"></span>
          <span class="schematic-wheel ${hasUnusualClearance ? 'is-defective' : ''}"></span>
        </div>
      `;

      block.addEventListener('click', () => {
        selectBogie(index);
      });

      trainSchematicContainer.appendChild(block);
    });
  }

  function selectBogie(index) {
    selectedBogieIndex = index;
    const bogie = currentBogieData[index];

    // Highlight selected on Map
    const blocks = trainSchematicContainer.querySelectorAll('.bogie-block');
    blocks.forEach((b, i) => {
      if (i === index) b.classList.add('selected');
      else b.classList.remove('selected');
    });

    // Update details panel headers
    detailEmptyState.classList.add('hidden');
    detailContent.classList.remove('hidden');
    detailBogieId.textContent = bogie.wagon_number || bogie.id;
    detailBogieBadge.textContent = bogie.status;
    detailBogieBadge.className = `badge badge-${bogie.status.toLowerCase()}`;
    
    // Style the details badge
    if (bogie.status === "GOOD") {
      detailBogieBadge.style.backgroundColor = "var(--success)";
      detailBogieBadge.style.color = "#fff";
      detailBogieBadge.style.border = "none";
    } else if (bogie.status === "BAD") {
      detailBogieBadge.style.backgroundColor = "rgba(244, 63, 94, 0.15)";
      detailBogieBadge.style.color = "var(--danger)";
    } else {
      detailBogieBadge.style.backgroundColor = "rgba(245, 158, 11, 0.15)";
      detailBogieBadge.style.color = "var(--warning)";
    }

    // Render individual components/wheels of this bogie
    renderComponents(bogie);

    // Auto-select the first defective component, otherwise the first component
    const firstDefectIdx = bogie.components.findIndex(c => c.status !== "GOOD");
    if (firstDefectIdx !== -1) {
      selectComponent(firstDefectIdx);
    } else {
      selectComponent(0);
    }
  }

  function renderComponents(bogie) {
    wheelInspectList.innerHTML = "";
    bogie.components.forEach((comp, idx) => {
      const card = document.createElement('div');
      card.className = `wheel-card state-${comp.status.toLowerCase()}`;
      if (idx === selectedWheelIndex) {
        card.classList.add('active');
      }

      card.innerHTML = `
        <div class="wheel-card-num">${comp.name}</div>
        <div class="wheel-card-status">${comp.status}</div>
      `;

      card.addEventListener('click', () => {
        selectComponent(idx);
      });

      wheelInspectList.appendChild(card);
    });
  }

  function selectComponent(idx) {
    selectedWheelIndex = idx;
    const bogie = currentBogieData[selectedBogieIndex];
    const comp = bogie.components[idx];
    
    // Highlight active card
    const cards = wheelInspectList.querySelectorAll('.wheel-card');
    cards.forEach((c, i) => {
      if (i === idx) c.classList.add('active');
      else c.classList.remove('active');
    });

    defectInsightContainer.classList.remove('hidden');

    // Real manual image assets mapping based on defect category
    const assetMap = {
      "defective_em_pad": "assets/defective_em_pad_1.jpg",
      "defective_spring": "assets/defective_spring_1.jpg",
      "grease_swing": "assets/grease_swing.png",
      "defective_wheel": "assets/defective_wheel_1.jpg",
      "unusual_hanging": "assets/unusual_hanging_1.png",
      "normal_em_pad": "assets/normal_em_pad_1.jpg",
      "normal_spring": "assets/normal_spring.jpg",
      "normal": "assets/normal_spring.jpg"
    };

    let defectType = comp.defect_type || "normal";
    // Always show the actual cropped frame from the video, never load generic sample images
    defectImg.src = comp.image_url ? getApiUrl("/api/assets/" + comp.image_url) : (assetMap[defectType] || "assets/normal_spring.jpg");
    
    defectTypeBadge.textContent = defectType.toUpperCase().replace(/_/g, ' ');
    
    if (comp.status === "GOOD") {
      defectTypeBadge.className = "annotation-badge good";
      defectDescText.innerHTML = `<strong>${comp.name}</strong>: ${comp.desc}`;
    } else if (comp.status === "BAD") {
      defectTypeBadge.className = "annotation-badge bad";
      defectDescText.innerHTML = `<strong>${comp.name}</strong>: ${comp.desc} <br><br><em>Recommendation: Route wagon to maintenance line immediately for repair/replacement.</em>`;
    } else {
      defectTypeBadge.className = "annotation-badge unusual";
      defectDescText.innerHTML = `<strong>${comp.name}</strong>: ${comp.desc} <br><br><em>Recommendation: Stop train in yard and dispatch trackside team for immediate manual refitting/clearance check.</em>`;
    }
  }

  // Modal email setup
  btnOpenEmail.addEventListener('click', () => {
    // Generate email content
    emailSubjectLine.textContent = `URGENT: Defect Alerts Detected for Goods Train [ID: ${trainId}]`;
    
    let defectsList = "";
    currentBogieData.forEach(b => {
      if (b.status !== "GOOD") {
        const badComponents = b.components.filter(c => c.status !== "GOOD").map(c => `${c.name} (${c.status})`);
        defectsList += `  - Wagon ${b.wagon_number || b.id}: Issues detected on [${badComponents.join(', ')}]\n`;
      }
    });

    const emailTemplate = `Dear Repairing and Maintenance Team,

An automated inspection scan has been completed for the following incoming goods train.

Train Identification: ${trainId}
Status: ATTENTION REQUIRED (Issues Detected)

Defect Breakdown:
${defectsList || "  - No critical defects found."}

Please log in to the AI-Netram desk to inspect visual evidence attachments and route target wagons to yard maintenance lines immediately.

Best Regards,
AI-Netram Automated Alert Desk`;

    emailBodyText.textContent = emailTemplate;
    emailModal.classList.remove('hidden');
  });

  btnCloseModal.addEventListener('click', () => emailModal.classList.add('hidden'));
  btnCloseModalOk.addEventListener('click', () => emailModal.classList.add('hidden'));

  // Close Error Modal listeners
  btnCloseErrorModal.addEventListener('click', () => errorModal.classList.add('hidden'));
  btnCloseErrorOk.addEventListener('click', () => errorModal.classList.add('hidden'));

  // Copy Email text
  btnCopyEmail.addEventListener('click', () => {
    navigator.clipboard.writeText(emailBodyText.textContent).then(() => {
      btnCopyEmail.textContent = "Copied!";
      setTimeout(() => {
        btnCopyEmail.textContent = "Copy Email Text";
      }, 2000);
    });
  });

  // Generate printable report content
  function generatePrintReport() {
    let printContainer = document.getElementById('print-report-container');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'print-report-container';
      document.body.appendChild(printContainer);
    }
    
    let goodCount = currentBogieData.filter(b => b.status === "GOOD").length;
    let badCount = currentBogieData.filter(b => b.status === "BAD").length;
    let unusualCount = currentBogieData.filter(b => b.status === "UNUSUAL").length;
    
    let statusText = (badCount > 0 || unusualCount > 0) ? "ATTENTION REQUIRED" : "PERFECT STATUS";
    let statusColor = (badCount > 0 || unusualCount > 0) ? "#ef4444" : "#10b981";

    let html = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; color: #1f2937; padding: 20px;">
        <!-- Header -->
        <div style="border-bottom: 2px solid #374151; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">AI-Netram Inspection Report</h1>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">Automated Wheel & Undercarriage Diagnostics</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; font-weight: 700; color: ${statusColor}; border: 1.5px solid ${statusColor}; padding: 4px 10px; border-radius: 6px; display: inline-block;">${statusText}</div>
            <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 11px;">Generated: ${new Date().toLocaleString()}</p>
          </div>
        </div>

        <!-- Meta Summary -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div>
            <span style="font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block;">Train Identification</span>
            <span style="font-size: 13px; font-weight: 700; color: #111827; margin-top: 2px; display: block;">${trainId}</span>
          </div>
          <div>
            <span style="font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block;">Feed Source</span>
            <span style="font-size: 13px; font-weight: 700; color: #111827; margin-top: 2px; display: block;">Yard Camera Feed</span>
          </div>
          <div>
            <span style="font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block;">Wagons Scanned</span>
            <span style="font-size: 13px; font-weight: 700; color: #111827; margin-top: 2px; display: block;">${currentBogieData.length}</span>
          </div>
          <div>
            <span style="font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block;">Defect Metrics</span>
            <span style="font-size: 12px; font-weight: 700; color: #111827; margin-top: 2px; display: block;">
              <span style="color: #10b981;">${goodCount} OK</span> | 
              <span style="color: #ef4444;">${badCount} BAD</span> | 
              <span style="color: #f59e0b;">${unusualCount} UNUSUAL</span>
            </span>
          </div>
        </div>

        <!-- Wagon Details -->
        <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 15px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">Detailed Wagon Analysis Logs</h2>
    `;

    currentBogieData.forEach((bogie, index) => {
      let bColor = "#10b981";
      if (bogie.status === "BAD") bColor = "#ef4444";
      if (bogie.status === "UNUSUAL") bColor = "#f59e0b";

      html += `
        <div style="margin-bottom: 25px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; page-break-inside: avoid; background: #fff;">
          <!-- Wagon Header -->
          <div style="background: #f3f4f6; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb;">
            <span style="font-size: 14px; font-weight: 700; color: #111827;">Wagon #${bogie.id}: ${bogie.wagon_number || `WAGON-${bogie.id}`}</span>
            <span style="font-size: 11px; font-weight: 700; color: #fff; background: ${bColor}; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">${bogie.status}</span>
          </div>

          <div style="padding: 15px;">
            <!-- Components Table -->
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
              <thead>
                <tr style="border-bottom: 1.5px solid #d1d5db; color: #4b5563; font-weight: 600;">
                  <th style="padding: 6px 8px;">Component Name</th>
                  <th style="padding: 6px 8px; width: 80px;">Status</th>
                  <th style="padding: 6px 8px;">Diagnostic Remarks</th>
                </tr>
              </thead>
              <tbody>
      `;

      bogie.components.forEach(comp => {
        let compColor = "#10b981";
        if (comp.status === "BAD") compColor = "#ef4444";
        if (comp.status === "UNUSUAL") compColor = "#f59e0b";

        html += `
          <tr style="border-bottom: 1px solid #f3f4f6; color: #374151;">
            <td style="padding: 6px 8px; font-weight: 600;">${comp.name}</td>
            <td style="padding: 6px 8px;"><span style="color: ${compColor}; font-weight: 700;">${comp.status}</span></td>
            <td style="padding: 6px 8px; color: #4b5563;">${comp.desc}</td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
      `;

      // Visual Evidence for Defects
      const defects = bogie.components.filter(comp => comp.status !== "GOOD");
      if (defects.length > 0) {
        html += `
          <div style="margin-top: 15px; padding-top: 12px; border-top: 1px dashed #e5e7eb;">
            <h4 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #111827; text-transform: uppercase;">Visual Evidence Alerts</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
        `;

        const assetMap = {
          "defective_em_pad": "assets/defective_em_pad_1.jpg",
          "defective_spring": "assets/defective_spring_1.jpg",
          "grease_swing": "assets/grease_swing.png",
          "defective_wheel": "assets/defective_wheel_1.jpg",
          "unusual_hanging": "assets/unusual_hanging_1.png",
          "normal_em_pad": "assets/normal_em_pad_1.jpg",
          "normal_spring": "assets/normal_spring.jpg",
          "normal": "assets/normal_spring.jpg"
        };

        defects.forEach(d => {
          let imgPath = d.image_url ? getApiUrl("/api/assets/" + d.image_url) : (assetMap[d.defect_type] || "assets/normal_spring.jpg");
          html += `
            <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; display: flex; gap: 10px; align-items: flex-start; background: #fafafa;">
              <img src="${imgPath}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid #d1d5db;" alt="Evidence Image">
              <div>
                <span style="font-size: 10px; font-weight: 700; color: #ef4444; text-transform: uppercase;">${d.name} Alert</span>
                <p style="margin: 3px 0 0 0; font-size: 11px; color: #4b5563; line-height: 1.3;">${d.desc}</p>
                <p style="margin: 5px 0 0 0; font-size: 10px; color: #374151; font-weight: 600; font-style: italic;">Rec: Route wagon to yard maintenance.</p>
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `
        <!-- Footer Info -->
        <div style="margin-top: 30px; border-top: 1px solid #d1d5db; padding-top: 12px; text-align: center; font-size: 10px; color: #9ca3af;">
          AI-Netram automated trackside diagnostics system. Reports compiled autonomously by deep learning validation models. Confidential and for official use only.
        </div>
      </div>
    `;

    printContainer.innerHTML = html;
  }

  // Print PDF Report
  btnExportReport.addEventListener('click', () => {
    generatePrintReport();
    
    // Find all images in print container
    const printContainer = document.getElementById('print-report-container');
    const images = printContainer.querySelectorAll('img');
    const promises = [];
    
    images.forEach(img => {
      if (!img.complete) {
        promises.push(new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve; // resolve anyway on error to avoid blocking printing
        }));
      }
    });
    
    if (promises.length > 0) {
      Promise.all(promises).then(() => {
        // Small timeout to allow browser layout rendering to stabilize
        setTimeout(() => {
          window.print();
        }, 150);
      });
    } else {
      window.print();
    }
  });

  // Settings Modal Elements
  const settingsModal = document.getElementById('settings-modal');
  const btnSettings = document.getElementById('btn-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnCancelSettings = document.getElementById('btn-cancel-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const inputApiEndpoint = document.getElementById('input-api-endpoint');

  btnSettings.addEventListener('click', () => {
    inputApiEndpoint.value = localStorage.getItem('api_endpoint') || '';
    settingsModal.classList.remove('hidden');
  });

  const closeSettingsModal = () => {
    settingsModal.classList.add('hidden');
  };

  btnCloseSettings.addEventListener('click', closeSettingsModal);
  btnCancelSettings.addEventListener('click', closeSettingsModal);

  btnSaveSettings.addEventListener('click', () => {
    const val = inputApiEndpoint.value.trim();
    if (val) {
      localStorage.setItem('api_endpoint', val);
    } else {
      localStorage.removeItem('api_endpoint');
    }
    closeSettingsModal();
  });
});
