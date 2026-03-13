import * as THREE from 'https://esm.sh/three@0.159.0';
import { OrbitControls } from 'https://esm.sh/three@0.159.0/examples/jsm/controls/OrbitControls.js';
import { LineSegments2 } from 'https://esm.sh/three@0.159.0/examples/jsm/lines/LineSegments2.js';
import { LineMaterial } from 'https://esm.sh/three@0.159.0/examples/jsm/lines/LineMaterial.js';
import { LineSegmentsGeometry } from 'https://esm.sh/three@0.159.0/examples/jsm/lines/LineSegmentsGeometry.js';

export default class Ecosystem {
    constructor(container, baseUrl = './') {
        this.container = container;
        this.baseUrl = baseUrl;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.nodes = [];
        this.needsConnectionUpdate = false; // flag for connection geometry updates
        this.targetTheta = 0; // azimuth angle target
        this.targetPhi = Math.PI / 2; // polar angle target
        this.connections = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Configuration
        this.nodeCount = 307; // Number of images
        this.connectionDistance = 40; // Max distance to connect nodes
        this.tagsData = {};
        this.activeTags = new Set();
        this.allTags = new Set();
        this.tagCenters = {}; // tag -> Vector3 position
        this.showingAll = false;

        this.imagesVisible = true;
        this.nodesReady = false; // Flag to track if nodes are fully loaded
        this.loadedNodeCount = 0; // Counter for loaded nodes
        this.tagsLoaded = false;
        this.currentLayout = 'random'; // New state tracker

        // Socket.io removed for static version
        // this.socket = io();
        // this.setupSocketListeners();

        // Auto-reload tags
        this.tagUpdatesChannel = new BroadcastChannel('tag-updates');
        this.tagUpdatesChannel.onmessage = (event) => {
            if (event.data.type === 'tagsUpdated') {
                console.log('Tags updated, reloading...');
                this.reloadTags();
            }
        };

        // Idle state for gentle floating animation
        this.isIdle = true;
        this.idleTime = 0;
        this.lastInteractionTime = Date.now();
        this.currentAutoRotateSpeed = 0;
        this.targetAutoRotateSpeed = 0.3; // Target speed for idle rotation

        // Pose detection
        this.poseDetector = null;
        this.poseVideo = null;
        this.isPoseTracking = false;
        this.lastPoseKeypoints = null;
        this.trackedPoses = []; // Store previous frame's poses for stable tracking
        this.nextTrackId = 0; // Counter for assigning unique IDs to new people

        // Audio Reactivity
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.isAudioActive = false;
        this.audioSource = null;

        // Optimization: Temp vectors for updateConnections to avoid GC
        this._tempStart = new THREE.Vector3();
        this._tempEnd = new THREE.Vector3();
        this._tempMid = new THREE.Vector3();
        this._tempCurvePt = new THREE.Vector3();
    }

    setupSocketListeners() {
        // Disabled for static version
    }

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.addLights();
        this.createParticles();
        this.loadAssetsAndCreateNodes();
        this.loadTags(); // Load tags instead of ML analysis
        this.animate();

        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#FCF3EA');
        this.scene.fog = new THREE.FogExp2(0xFCF3EA, 0.0004); // Even lighter fog
    }

    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1,
            2000 // Increased far plane
        );
        this.camera.position.set(0, 0, 400); // Start further back
        this.targetZoom = 400;
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);
    }

    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 1.0;
        this.controls.minDistance = 50;
        this.controls.maxDistance = 1000; // Increase max distance

        this.controls.enablePan = true;
        this.controls.panSpeed = 1.0;
        this.controls.screenSpacePanning = true;

        this.controls.enableRotate = true;
        this.controls.rotateSpeed = 1.2;

        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;

        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };

        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };

        this.userControlling = false;
        this.lastControlTime = 0;

        this.controls.addEventListener('start', () => {
            this.userControlling = true;
            this.lastControlTime = Date.now();
            this.lastInteractionTime = Date.now();
            this.isIdle = false;
        });

        this.controls.addEventListener('end', () => {
            setTimeout(() => {
                this.userControlling = false;
            }, 1000);
        });

        // Only update idle state on change if user is actively controlling
        // This prevents autoRotate (which triggers 'change') from resetting the idle timer
        this.controls.addEventListener('change', () => {
            if (this.userControlling) {
                this.lastInteractionTime = Date.now();
                this.isIdle = false;
            }
        });

        // Add explicit wheel listener since OrbitControls might not fire 'start' for scrolling
        this.renderer.domElement.addEventListener('wheel', () => {
            this.lastInteractionTime = Date.now();
            this.isIdle = false;
            this.userControlling = true;
            // Reset userControlling after a short delay since wheel doesn't have an 'end' event
            clearTimeout(this.wheelTimeout);
            this.wheelTimeout = setTimeout(() => {
                this.userControlling = false;
            }, 200);
        });
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        this.pointLight = pointLight;
        this.scene.add(pointLight);
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        for (let i = 0; i < 1000; i++) {
            vertices.push(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({
            color: 0x888888,
            size: 2,
            transparent: true,
            opacity: 0.5,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    async loadAssetsAndCreateNodes() {
        const textureLoader = new THREE.TextureLoader();
        const geometry = new THREE.PlaneGeometry(10, 10);

        try {
            const cacheBuster = `?v=${Date.now()}`;
            // Load the new thumbnail map instead of the raw image list
            const response = await fetch(`${this.baseUrl}thumbnail_map.json${cacheBuster}`);
            if (!response.ok) throw new Error('Failed to load thumbnail_map.json');
            const imageMap = await response.json(); // Array of { original, thumbnail }

            this.nodeCount = imageMap.length;
            console.log(`[Ecosystem] Found ${this.nodeCount} images. Starting batched load...`);

            // Batched loading configuration
            const BATCH_SIZE = 5; // Load 5 images per frame
            let currentIndex = 0;

            const loadBatch = () => {
                if (currentIndex >= this.nodeCount) {
                    console.log('[loadAssets] All batches initiated.');
                    return;
                }

                const batchEnd = Math.min(currentIndex + BATCH_SIZE, this.nodeCount);

                for (let i = currentIndex; i < batchEnd; i++) {
                    const item = imageMap[i];
                    const id = item.original; // Use original path as ID for tags
                    // Construct path to thumbnail. We assume assets/thumbnails is relative to baseUrl
                    const texturePath = `${this.baseUrl}assets/thumbnails/${item.thumbnail}`;

                    textureLoader.load(texturePath, (texture) => {
                        this.createNodeFromTexture(texture, id, geometry);
                    }, undefined, (err) => {
                        console.warn(`[loadAssets] Failed: ${texturePath}`);
                        this.handleNodeLoadComplete(); // Still count as processed
                    });
                }

                currentIndex = batchEnd;

                // Schedule next batch
                if (currentIndex < this.nodeCount) {
                    requestAnimationFrame(loadBatch);
                }
            };

            // Start the loading process
            loadBatch();

        } catch (error) {
            console.error('Error loading assets:', error);
        }
    }

    createNodeFromTexture(texture, id, geometry) {
        const vertexShader = `
            varying vec2 vUv;
            varying float vDist;
            #include <fog_pars_vertex>

            void main() {
              vUv = uv;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vDist = -mvPosition.z;
              gl_Position = projectionMatrix * mvPosition;
              #include <fog_vertex>
            }
          `;

        const fragmentShader = `
            uniform sampler2D map;
            uniform float brightness;
            uniform float contrast;
            uniform float opacity;
            uniform float audioStrength;
            uniform float time;
            varying vec2 vUv;
            #include <fog_pars_fragment>

            void main() {
              vec2 uv = vUv;
              
              if (audioStrength > 0.5) {
                  float wave = sin(uv.y * 20.0 + time * 20.0) * audioStrength * 0.08;
                  uv.x += wave;
              }

              float shift = audioStrength * 0.06;
              
              vec4 texColor = texture2D(map, uv);
              float r = texture2D(map, uv + vec2(shift, 0.0)).r;
              float g = texture2D(map, uv).g;
              float b = texture2D(map, uv - vec2(shift, 0.0)).b;
              
              vec3 color = vec3(r, g, b);
              
              color = (color - 0.5) * contrast + 0.5;
              color = color + brightness;
              
              gl_FragColor = vec4(color, texColor.a * opacity);
              
              #include <fog_fragment>
            }
          `;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: texture },
                brightness: { value: 0 },
                contrast: { value: 1 },
                opacity: { value: 1.0 },
                audioStrength: { value: 0.0 },
                time: { value: 0.0 },
                ...THREE.UniformsLib.fog
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            fog: true
        });

        const mesh = new THREE.Mesh(geometry, material);

        const aspect = texture.image.width / texture.image.height;
        let scaleX = 1;
        let scaleY = 1;

        if (aspect > 1) {
            scaleX = 1;
            scaleY = 1 / aspect;
        } else {
            scaleX = aspect;
            scaleY = 1;
        }

        mesh.scale.set(scaleX, scaleY, 1);

        mesh.position.x = (Math.random() - 0.5) * 200;
        mesh.position.y = (Math.random() - 0.5) * 200;
        mesh.position.z = (Math.random() - 0.5) * 200;

        const targetPosition = mesh.position.clone();

        mesh.userData = {
            id: id,
            originalScale: mesh.scale.clone(),
            tags: [],
            targetPosition: targetPosition,
            targetOpacity: 1.0,
            currentOpacity: 1.0,
            moveSpeed: 0.01 + Math.random() * 0.01
        };

        this.assignTagsToNode(mesh);
        this.scene.add(mesh);
        this.nodes.push(mesh);

        this.handleNodeLoadComplete();
    }

    handleNodeLoadComplete() {
        this.loadedNodeCount++;

        if (this.loadedNodeCount === this.nodeCount) {
            console.log('[loadAssets] All nodes loaded! Setting nodesReady = true');
            this.nodesReady = true;

            if (this.tagsLoaded) {
                this.applyTagsToNodes();
            }

            setTimeout(() => {
                this.updateConnections();
            }, 100);
        }
    }

    async loadTags() {
        try {
            const cacheBuster = `?v=${Date.now()}`;
            const response = await fetch(`${this.baseUrl}tags.json${cacheBuster}`);
            if (!response.ok) throw new Error('Failed to load tags.json');
            this.tagsData = await response.json();
            this.tagsLoaded = true;
            console.log('[Ecosystem] Tags loaded:', Object.keys(this.tagsData).length, 'entries');

            this.allTags.clear();
            Object.values(this.tagsData).forEach(tags => {
                tags.forEach(tag => this.allTags.add(tag));
            });

            this.activeTags = new Set(this.allTags);
            this.showingAll = true;

            this.calculateTagCenters();

            if (this.nodesReady) {
                this.applyTagsToNodes();
            }

            // Dispatch event for UI
            const event = new CustomEvent('tags-loaded', { detail: { tags: Array.from(this.allTags) } });
            window.dispatchEvent(event);

        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }

    assignTagsToNode(node) {
        if (!this.tagsData) return;
        const tags = this.tagsData[node.userData.id];
        if (tags) {
            node.userData.tags = tags;
            // console.log(`[Ecosystem] Assigned tags to ${node.userData.id}:`, tags);
        }
    }

    applyTagsToNodes() {
        if (!this.tagsData) return;

        console.log('[Ecosystem] Applying tags to all existing nodes...');
        this.nodes.forEach(node => {
            this.assignTagsToNode(node);
        });

        // Removed forced applyTagLayout() to respect initial 'random' mode
        // this.applyTagLayout(); 

        // Ensure we trigger an update for whatever the current layout is (default is random)
        if (this.currentLayout === 'random') {
            this.randomizeLayout();
        } else if (this.currentLayout === 'grouped') {
            this.applyTagLayout();
        } else if (this.currentLayout === 'grid') {
            this.gridLayout();
        }

        this.updateVisibility();
    }

    async reloadTags() {
        await this.loadTags();
        this.updateVisibility();
    }

    filterByTag(tag) {
        console.log(`[Ecosystem] Filtering by tag: "${tag}"`);
        if (tag === 'all') {
            this.showingAll = true;
            this.activeTags = new Set(this.allTags);
        } else {
            this.showingAll = false;
            this.activeTags.clear();
            this.activeTags.add(tag);
        }
        this.updateVisibility();

        // Only re-apply layout if we are already in grouped mode
        if (this.currentLayout === 'grouped') {
            this.applyTagLayout();
        }
    }

    calculateTagCenters() {
        // Group tags by Type (category) vs Name (project)
        // tagsData[img] = [projectName, category]
        const typeCenters = {};
        const categories = new Set();
        Object.values(this.tagsData).forEach(tags => {
            if (tags.length > 1) {
                categories.add(tags[1]);
            } else {
                categories.add(tags[0]);
            }
        });

        const catArray = Array.from(categories);
        const catCount = catArray.length;
        const mainRadius = 150; // Reduced from 220 to keep projects closer

        const phi = Math.PI * (3 - Math.sqrt(5));
        catArray.forEach((cat, i) => {
            const y = (catCount === 1) ? 0 : 1 - (i / (catCount - 1)) * 2;
            const radiusAtY = Math.sqrt(1 - y * y);
            const theta = phi * i;
            const x = Math.cos(theta) * radiusAtY;
            const z = Math.sin(theta) * radiusAtY;
            typeCenters[cat] = new THREE.Vector3(x * mainRadius, y * mainRadius, z * mainRadius);
            this.tagCenters[cat] = typeCenters[cat].clone();
        });

        const projectsByType = {};
        Object.values(this.tagsData).forEach(tags => {
            if (tags.length > 1) {
                const [projectName, category] = tags;
                if (!projectsByType[category]) projectsByType[category] = new Set();
                projectsByType[category].add(projectName);
            }
        });

        Object.keys(projectsByType).forEach(cat => {
            const projects = Array.from(projectsByType[cat]);
            const pCount = projects.length;
            const catCenter = typeCenters[cat];

            // Adjust sub-radius based on project count
            // Clamped to keep large clusters (photo/poster) tight
            const subRadius = Math.min(Math.max(50, pCount * 3), 110);

            projects.forEach((pName, i) => {
                // Spherical distribution around category center
                // Safe division to avoid NaN if pCount is 1
                const ratio = pCount > 1 ? i / (pCount - 1) : 0;
                const pPhi = Math.acos(1 - 2 * ratio);
                const pTheta = phi * i;

                const offset = new THREE.Vector3(
                    Math.sin(pPhi) * Math.cos(pTheta) * subRadius,
                    Math.sin(pPhi) * Math.sin(pTheta) * subRadius,
                    Math.cos(pPhi) * subRadius
                );
                this.tagCenters[pName] = catCenter.clone().add(offset);
            });
        });
        console.log('[Ecosystem] Tag centers calculated:', Object.keys(this.tagCenters).length);
    }

    applyTagLayout() {
        this.currentLayout = 'grouped';
        this.nodes.forEach(node => {
            const tags = node.userData.tags;
            if (tags && tags.length > 0) {
                const targetPos = new THREE.Vector3();
                let foundCenter = false;

                // Prioritize the first tag (Project Name) if available and has a center
                // This prevents "averaging" which pulls project clusters into the category center
                for (const tag of tags) {
                    if (this.tagCenters[tag]) {
                        targetPos.copy(this.tagCenters[tag]);
                        foundCenter = true;
                        break; // Stop at the most specific tag
                    }
                }

                if (foundCenter) {
                    // Larger spread for single-category clusters (like photos/posters)
                    const spread = tags.length === 1 ? 80 : 30;
                    targetPos.set(
                        targetPos.x + (Math.random() - 0.5) * spread,
                        targetPos.y + (Math.random() - 0.5) * spread,
                        targetPos.z + (Math.random() - 0.5) * spread
                    );
                    node.userData.targetPosition.copy(targetPos);
                }
            } else {
                node.userData.targetPosition.set(
                    (Math.random() - 0.5) * 500, // Wider initial random spread
                    (Math.random() - 0.5) * 500,
                    (Math.random() - 0.5) * 500
                );
            }
        });
        this.needsConnectionUpdate = true;
    }

    randomizeLayout() {
        this.currentLayout = 'random';
        this.nodes.forEach(node => {
            node.userData.targetPosition.set(
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200
            );
        });
        this.needsConnectionUpdate = true;
    }

    gridLayout() {
        this.currentLayout = 'grid';
        const count = this.nodes.length;
        const side = Math.ceil(Math.pow(count, 1 / 3));
        const spacing = 40;
        const offset = (side * spacing) / 2;

        this.nodes.forEach((node, index) => {
            const x = (index % side) * spacing - offset;
            const y = (Math.floor(index / side) % side) * spacing - offset;
            const z = (Math.floor(index / (side * side))) * spacing - offset;

            node.userData.targetPosition.set(x, y, z);
        });
        this.needsConnectionUpdate = true;
    }

    async startBodyTracking() {
        console.log('[BodyTrack] Starting body tracking...');

        // Boost movement speed for responsive body tracking
        this.nodes.forEach(node => {
            if (!node.userData.originalMoveSpeed) {
                node.userData.originalMoveSpeed = node.userData.moveSpeed;
            }
            node.userData.moveSpeed = 0.08 + Math.random() * 0.04; // 0.08-0.12 for fast response
        });

        // Check if APIs are available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('[BodyTrack] getUserMedia not supported');
            alert('Camera API not supported in this browser. Please use Chrome, Firefox, or Edge.');
            return;
        }

        if (!window.poseDetection) {
            console.error('[BodyTrack] Pose detection library not loaded');
            alert('Pose detection library not loaded. Please refresh the page.');
            return;
        }

        try {
            console.log('[BodyTrack] Requesting camera access...');

            // Request camera access with more permissive constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });

            console.log('[BodyTrack] Camera access granted!');

            // Create video element if it doesn't exist
            if (!this.poseVideo) {
                this.poseVideo = document.createElement('video');
                this.poseVideo.style.display = 'none';
                this.poseVideo.autoplay = true;
                this.poseVideo.playsInline = true;
                this.poseVideo.muted = true;
                document.body.appendChild(this.poseVideo);
            }

            this.poseVideo.srcObject = stream;

            // Wait for video to be ready
            await new Promise((resolve) => {
                this.poseVideo.onloadedmetadata = () => {
                    console.log('[BodyTrack] Video metadata loaded');
                    resolve();
                };
            });

            await this.poseVideo.play();
            console.log('[BodyTrack] Video playing');

            // Initialize pose detector
            if (!this.poseDetector) {
                console.log('[BodyTrack] Initializing TensorFlow backend...');

                // Wait for TensorFlow to be ready
                await window.tf.ready();
                console.log('[BodyTrack] TensorFlow backend ready');

                console.log('[BodyTrack] Creating pose detector...');
                const detectorConfig = {
                    modelType: window.poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
                    enableSmoothing: true,
                    trackerType: window.poseDetection.TrackerType.BoundingBox
                };
                this.poseDetector = await window.poseDetection.createDetector(
                    window.poseDetection.SupportedModels.MoveNet,
                    detectorConfig
                );
                console.log('[BodyTrack] Pose detector initialized successfully!');
            }

            this.isPoseTracking = true;
            this.detectPose();

            console.log('[BodyTrack] Body tracking started successfully!');

        } catch (error) {
            console.error('[BodyTrack] Detailed error:', error);
            console.error('[BodyTrack] Error name:', error.name);
            console.error('[BodyTrack] Error message:', error.message);

            let errorMessage = 'Failed to start body tracking. ';

            if (error.name === 'NotAllowedError') {
                errorMessage += 'Camera access was denied. Please allow camera access in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No camera found. Please connect a camera and try again.';
            } else if (error.name === 'NotReadableError') {
                errorMessage += 'Camera is already in use by another application. Please close other apps using the camera.';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage += 'Camera constraints could not be satisfied. Trying with default settings...';
                // Retry with minimal constraints
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    this.poseVideo.srcObject = stream;
                    await this.poseVideo.play();
                    return;
                } catch (retryError) {
                    errorMessage = 'Camera access failed even with default settings.';
                }
            } else {
                errorMessage += error.message;
            }

            alert(errorMessage);
        }
    }

    async detectPose() {
        if (!this.isPoseTracking || !this.poseDetector || !this.poseVideo) {
            return;
        }

        try {
            const poses = await this.poseDetector.estimatePoses(this.poseVideo);

            if (poses.length > 0) {
                // Filter poses with low confidence
                const validPoses = poses.filter(pose => pose.score > 0.2);

                if (validPoses.length > 0) {
                    // Limit to 2 people max
                    const limitedPoses = validPoses.slice(0, 2);

                    // Match poses to previous frame for stable tracking
                    const matchedPoses = this.matchPosesToPrevious(limitedPoses);

                    // Store for next frame
                    this.trackedPoses = matchedPoses;

                    this.applyBodyTrackLayout(matchedPoses);
                }
            }
        } catch (error) {
            console.error('[BodyTrack] Pose detection error:', error);
        }

        // Continue detection loop at ~15 FPS for more responsive tracking
        setTimeout(() => this.detectPose(), 66);
    }

    matchPosesToPrevious(currentPoses) {
        // First frame - assign initial track IDs
        if (this.trackedPoses.length === 0) {
            return currentPoses.map((pose, i) => ({
                ...pose,
                trackId: this.nextTrackId++
            }));
        }

        // Calculate torso center for each pose
        const getTorsoCenter = (pose) => {
            const leftShoulder = pose.keypoints[5];
            const rightShoulder = pose.keypoints[6];
            const leftHip = pose.keypoints[11];
            const rightHip = pose.keypoints[12];

            // Average of shoulders and hips
            const validPoints = [leftShoulder, rightShoulder, leftHip, rightHip]
                .filter(kp => kp && kp.score > 0.3);

            if (validPoints.length === 0) return null;

            const x = validPoints.reduce((sum, kp) => sum + kp.x, 0) / validPoints.length;
            const y = validPoints.reduce((sum, kp) => sum + kp.y, 0) / validPoints.length;
            return { x, y };
        };

        // Match current poses to previous poses based on position proximity
        const matched = [];
        const usedCurrentIndices = new Set();
        const usedPrevIndices = new Set();

        // For each previous pose, find the closest current pose
        for (let prevIdx = 0; prevIdx < this.trackedPoses.length; prevIdx++) {
            const prevPose = this.trackedPoses[prevIdx];
            const prevCenter = getTorsoCenter(prevPose);
            if (!prevCenter) continue;

            let bestMatchIdx = -1;
            let bestDist = Infinity;

            for (let currIdx = 0; currIdx < currentPoses.length; currIdx++) {
                if (usedCurrentIndices.has(currIdx)) continue;

                const currCenter = getTorsoCenter(currentPoses[currIdx]);
                if (!currCenter) continue;

                const dist = Math.sqrt(
                    Math.pow(currCenter.x - prevCenter.x, 2) +
                    Math.pow(currCenter.y - prevCenter.y, 2)
                );

                // Only match if within reasonable distance (150 pixels)
                if (dist < bestDist && dist < 150) {
                    bestDist = dist;
                    bestMatchIdx = currIdx;
                }
            }

            if (bestMatchIdx !== -1) {
                usedCurrentIndices.add(bestMatchIdx);
                usedPrevIndices.add(prevIdx);
                matched.push({
                    ...currentPoses[bestMatchIdx],
                    trackId: prevPose.trackId
                });
            }
        }

        // Add any new people (unmatched current poses)
        for (let currIdx = 0; currIdx < currentPoses.length; currIdx++) {
            if (!usedCurrentIndices.has(currIdx)) {
                matched.push({
                    ...currentPoses[currIdx],
                    trackId: this.nextTrackId++
                });
            }
        }

        // Sort by trackId to ensure consistent node assignment
        matched.sort((a, b) => a.trackId - b.trackId);

        return matched;
    }

    applyBodyTrackLayout(poses) {
        // MoveNet keypoints: 0-nose, 1-2:eyes, 3-4:ears, 5-6:shoulders, 
        // 7-8:elbows, 9-10:wrists, 11-12:hips, 13-14:knees, 15-16:ankles

        if (!poses || poses.length === 0) return;

        // Calculate nodes per person
        const nodesPerPerson = Math.floor(this.nodes.length / poses.length);
        let globalNodeIndex = 0;

        poses.forEach((pose, poseIndex) => {
            const keypoints = pose.keypoints;

            // Filter keypoints with good confidence
            const validKeypoints = keypoints.filter(kp => kp.score > 0.3);
            if (validKeypoints.length < 5) {
                return;
            }

            // Define body regions with their keypoint paths
            // Adjusted weights and widths for better body shape definition
            const regions = {
                head: {
                    path: [0, 1, 2, 3, 4], // nose, eyes, ears
                    weight: 0.10, // Reduced from 0.15
                    width: 12 // Reduced from 25 (50% tighter)
                },
                neck: {
                    path: [0, 5, 6],
                    weight: 0.03, // Reduced from 0.05
                    width: 8 // Reduced from 15 (50% tighter)
                },
                torso: {
                    path: [5, 6, 11, 12],
                    weight: 0.35, // Increased from 0.3
                    width: 18, // Reduced from 35 (50% tighter)
                    isFill: true
                },
                leftArm: {
                    path: [5, 7, 9],
                    weight: 0.08, // Reduced from 0.1
                    width: 6 // Reduced from 12 (50% tighter)
                },
                rightArm: {
                    path: [6, 8, 10],
                    weight: 0.08, // Reduced from 0.1
                    width: 6 // Reduced from 12 (50% tighter)
                },
                leftLeg: {
                    path: [11, 13, 15],
                    weight: 0.18, // Increased from 0.15
                    width: 9 // Reduced from 18 (50% tighter)
                },
                rightLeg: {
                    path: [12, 14, 16],
                    weight: 0.18, // Increased from 0.15
                    width: 9 // Reduced from 18 (50% tighter)
                }
            };

            // Calculate start and end index for this person's nodes
            const startNodeIndex = poseIndex * nodesPerPerson;
            const endNodeIndex = (poseIndex === poses.length - 1) ? this.nodes.length : (poseIndex + 1) * nodesPerPerson;
            const totalNodesForPerson = endNodeIndex - startNodeIndex;

            let localNodeIndex = 0;

            // Distribute images across body regions
            Object.entries(regions).forEach(([regionName, config]) => {
                const { path: keypointIndices, weight, width, isFill } = config;

                const numImages = Math.floor(totalNodesForPerson * weight);

                const regionKeypoints = keypointIndices
                    .map(i => keypoints[i])
                    .filter(kp => kp && kp.score > 0.3);

                if (regionKeypoints.length === 0) {
                    return;
                }

                // Special handling for torso - fill the rectangular area
                if (isFill && regionKeypoints.length >= 4) {
                    const [leftShoulder, rightShoulder, leftHip, rightHip] = regionKeypoints;

                    for (let i = 0; i < numImages; i++) {
                        const currentNodeIndex = startNodeIndex + localNodeIndex;
                        if (currentNodeIndex >= endNodeIndex) break;

                        const node = this.nodes[currentNodeIndex];

                        // Use deterministic positioning based on index to avoid flickering
                        const gridCols = Math.ceil(Math.sqrt(numImages * 1.5));
                        const gridRows = Math.ceil(numImages / gridCols);
                        const col = i % gridCols;
                        const row = Math.floor(i / gridCols);

                        const tHorizontal = (col + 0.5) / gridCols;
                        const tVertical = (row + 0.5) / gridRows;

                        const topX = leftShoulder.x + (rightShoulder.x - leftShoulder.x) * tHorizontal;
                        const topY = leftShoulder.y + (rightShoulder.y - leftShoulder.y) * tHorizontal;
                        const bottomX = leftHip.x + (rightHip.x - leftHip.x) * tHorizontal;
                        const bottomY = leftHip.y + (rightHip.y - leftHip.y) * tHorizontal;

                        const finalX = topX + (bottomX - topX) * tVertical;
                        const finalY = topY + (bottomY - topY) * tVertical;

                        // Use deterministic spread based on node index to prevent flickering
                        const spreadX = Math.sin(currentNodeIndex * 2.5) * width * 0.3;
                        const spreadY = Math.cos(currentNodeIndex * 3.7) * width * 0.15;

                        const x = ((640 - (finalX + spreadX)) - 320) / 3.2;
                        const y = -((finalY + spreadY) - 240) / 2.4;
                        const z = Math.sin(currentNodeIndex * 1.3) * 15;

                        node.userData.targetPosition.set(x, y, z);
                        localNodeIndex++;
                    }
                } else {
                    // Linear body parts
                    for (let i = 0; i < numImages; i++) {
                        const currentNodeIndex = startNodeIndex + localNodeIndex;
                        if (currentNodeIndex >= endNodeIndex) break;

                        const node = this.nodes[currentNodeIndex];

                        const t = i / (numImages - 1 || 1);
                        const kpIndex = Math.min(Math.floor(t * (regionKeypoints.length - 1)), regionKeypoints.length - 2);
                        const localT = (t * (regionKeypoints.length - 1)) - kpIndex;

                        const p1 = regionKeypoints[kpIndex];
                        const p2 = regionKeypoints[kpIndex + 1];

                        if (p1 && p2) {
                            const finalX = p1.x + (p2.x - p1.x) * localT;
                            const finalY = p1.y + (p2.y - p1.y) * localT;

                            // Use deterministic spread based on node index to prevent flickering
                            const spreadX = (Math.sin(currentNodeIndex * 7.3) - 0.5) * width;
                            const spreadY = (Math.cos(currentNodeIndex * 5.7) - 0.5) * width;

                            const x = ((640 - (finalX + spreadX)) - 320) / 3.2;
                            const y = -((finalY + spreadY) - 240) / 2.4;
                            const z = (Math.sin(currentNodeIndex * 3.1) - 0.5) * 20;

                            node.userData.targetPosition.set(x, y, z);
                            localNodeIndex++;
                        }
                    }
                }
            });
        });
        this.needsConnectionUpdate = true;
    }

    stopBodyTracking() {
        this.isPoseTracking = false;

        // Reset tracking state
        this.trackedPoses = [];
        this.nextTrackId = 0;

        // Restore original movement speeds
        this.nodes.forEach(node => {
            if (node.userData.originalMoveSpeed) {
                node.userData.moveSpeed = node.userData.originalMoveSpeed;
                delete node.userData.originalMoveSpeed;
            }
        });

        if (this.poseVideo && this.poseVideo.srcObject) {
            this.poseVideo.srcObject.getTracks().forEach(track => track.stop());
            this.poseVideo.srcObject = null;
        }

        console.log('[BodyTrack] Stopped body tracking');
    }

    updateVisibility() {
        for (const node of this.nodes) {
            if (this.showingAll) {
                node.userData.targetOpacity = this.imagesVisible ? 1.0 : 0.0;
                continue;
            }

            const nodeTags = node.userData.tags;
            let shouldBeVisible = false;

            if (nodeTags && nodeTags.length > 0) {
                for (const tag of nodeTags) {
                    if (this.activeTags.has(tag)) {
                        shouldBeVisible = true;
                        break;
                    }
                }
            } else {
                shouldBeVisible = false;
            }

            node.userData.targetOpacity = (shouldBeVisible && this.imagesVisible) ? 1.0 : 0.0;
        }
        // Do not update connections here; they will be updated lazily when needed.
    }

    updateConnections() {
        // console.log('[updateConnections] Starting update...');

        // Don't render if nodes aren't ready yet
        if (!this.nodesReady) {
            console.warn('[updateConnections] Skipping - nodes not ready');
            return;
        }

        if (this.linesMesh) {
            this.scene.remove(this.linesMesh);
            this.linesMesh.geometry.dispose();
        }
        const positions = [];
        const opacities = []; // Store opacity for each line segment
        const visibleNodes = this.nodes.filter(n => {
            return n.userData.currentOpacity !== undefined && n.userData.currentOpacity > 0.01;
        });

        // console.log('[updateConnections] Visible nodes:', visibleNodes.length);

        for (let i = 0; i < visibleNodes.length; i++) {
            const nodeA = visibleNodes[i];

            for (let j = i + 1; j < visibleNodes.length; j++) {
                const nodeB = visibleNodes[j];
                const dist = nodeA.position.distanceTo(nodeB.position);

                // Connect if close enough OR if they share a tag
                let shouldConnect = false;

                // Check for shared tags
                const tagsA = nodeA.userData.tags || [];
                const tagsB = nodeB.userData.tags || [];

                // Connect if they share ANY tag (project or category)
                if (tagsA.length > 0 && tagsB.length > 0) {
                    const sharedTags = tagsA.filter(t => tagsB.includes(t));
                    if (sharedTags.length > 0) {
                        // Increase connection radius for shared tags
                        // 250 covers the full diameter of the clamped cluster (radius 110 * 2 = 220, plus margin)
                        if (dist < 250) {
                            shouldConnect = true;
                        }
                    }
                }

                // fallback to pure distance
                if (!shouldConnect && dist < 60) { // Increased from default connectionDistance
                    shouldConnect = true;
                }

                if (shouldConnect) {
                    // Create a curved path (Quadratic Bezier)
                    // Start and End points
                    const start = nodeA.position;
                    const end = nodeB.position;

                    // Control point (Midpoint + Upward offset)
                    // Calculate midpoint
                    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

                    // Offset the control point upwards to create an arc
                    // The height of the arc can be proportional to the distance
                    const arcHeight = dist * 0.2;
                    mid.y += arcHeight;

                    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

                    // Sample points along the curve
                    const divisions = 12; // Smoother curves
                    const points = curve.getPoints(divisions);

                    for (let k = 0; k < points.length - 1; k++) {
                        positions.push(
                            points[k].x, points[k].y, points[k].z,
                            points[k + 1].x, points[k + 1].y, points[k + 1].z
                        );
                    }
                }
            }
        }

        const segmentCount = positions.length / 6;
        // console.log(`[updateConnections] Generated ${segmentCount} line segments`);

        if (segmentCount === 0) {
            // console.warn('[updateConnections] No line segments to render!');
            return;
        }

        const geometry = new LineSegmentsGeometry();
        geometry.setPositions(positions);

        // Calculate average opacity of visible nodes for line opacity
        let avgOpacity = 0;
        if (visibleNodes.length > 0) {
            const totalOpacity = visibleNodes.reduce((sum, node) => {
                return sum + (node.userData.currentOpacity || 1.0);
            }, 0);
            avgOpacity = totalOpacity / visibleNodes.length;
        }

        const material = new LineMaterial({
            color: 0x808080,
            linewidth: 0.06, // Ultra-thin
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
            dashed: false,
            alphaToCoverage: false,
            transparent: true,
            opacity: 1, // 70% opacity
            depthTest: false,
            depthWrite: false
        });

        this.linesMesh = new LineSegments2(geometry, material);
        this.linesMesh.renderOrder = 999; // Ensure it renders on top
        this.scene.add(this.linesMesh);

        // console.log('[updateConnections] Lines added to scene');

        // Ensure resolution is set correctly
        material.resolution.set(window.innerWidth, window.innerHeight);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.linesMesh && this.linesMesh.material.resolution) {
            this.linesMesh.material.resolution.set(window.innerWidth, window.innerHeight);
        }
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.nodes.filter(n => n.visible));

        if (intersects.length > 0) {
            const object = intersects[0].object;
            console.log('Clicked node:', object.userData.id, 'Tags:', object.userData.tags);
        }
    }

    onKeyDown(event) {
        if (event.key === ' ') {
            event.preventDefault(); // Prevent page scroll
            this.randomizeLayout();
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        this.controls.update();

        // Smooth zoom (only when controlled by iPad, not manual controls)
        if (!this.userControlling && this.targetZoom && Math.abs(this.camera.position.z - this.targetZoom) > 0.1) {
            // We need to move the camera along its look vector or just Z if looking at 0,0,0
            // OrbitControls handles position, so we can just lerp the position length?
            // Or just lerp Z if we assume standard orientation.
            // Let's just lerp the length of the position vector to the target zoom (radius).

            const currentDist = this.camera.position.length();
            const newDist = THREE.MathUtils.lerp(currentDist, this.targetZoom, 0.1);
            this.camera.position.setLength(newDist);
        } else if (this.userControlling) {
            // When user is controlling, sync targetZoom to current distance
            this.targetZoom = this.camera.position.length();
        }

        if (this.particles) {
            this.particles.rotation.y += 0.0005;
        }

        // Check if we should enter idle state (100ms of no interaction)
        const timeSinceInteraction = Date.now() - this.lastInteractionTime;
        if (timeSinceInteraction > 100 && !this.isIdle) {
            this.isIdle = true;
            this.idleTime = 0;
        }

        // Update idle time
        // Don't apply idle rotation during body tracking
        if (this.isIdle && !this.isPoseTracking) {
            this.idleTime += 0.016; // ~60fps

            // Use OrbitControls autoRotate for smooth rotation
            if (this.controls) {
                this.controls.autoRotate = true;

                // Smoothly accelerate to target speed
                // "Try to go back to his pace"
                this.currentAutoRotateSpeed = THREE.MathUtils.lerp(
                    this.currentAutoRotateSpeed,
                    this.targetAutoRotateSpeed,
                    0.002 // Slow acceleration for "heavy" feel
                );

                // Add subtle "weird" organic variation
                // Sine wave modulation: +/- 0.001 speed variation over time
                const organicVariation = Math.sin(this.idleTime * 0.5) * 0.001;

                this.controls.autoRotateSpeed = this.currentAutoRotateSpeed + organicVariation;
            }
        } else {
            if (this.controls) {
                this.controls.autoRotate = false;
                // Reset speed so it starts from 0 next time
                this.currentAutoRotateSpeed = 0;
            }
        }

        // Audio Analysis
        let audioScale = 1.0;
        let audioStrength = 0.0;

        if (this.isAudioActive && this.analyser) {
            this.analyser.getByteFrequencyData(this.dataArray);

            // Calculate average volume from low-mid frequencies (bass/beat)
            let sum = 0;
            const count = Math.floor(this.dataArray.length / 4); // Focus on lower frequencies (bass)
            for (let i = 0; i < count; i++) {
                sum += this.dataArray[i];
            }
            const average = sum / count;

            // Higher threshold for "big noise"
            const threshold = 80; // Decreased from 100 to 80
            if (average > threshold) {
                // Stronger scale factor
                const normalizedStrength = (average - threshold) / (255 - threshold);
                audioStrength = normalizedStrength; // 0.0 to 1.0

                // Non-linear scaling for punchier effect
                // Increased multiplier from 1.5 to 3.0 for massive pulse
                audioScale = 1.0 + Math.pow(normalizedStrength, 2) * 3.0;
            }
        }

        let needsUpdate = false;

        if (this.nodes.length === 0 && Math.random() < 0.01) {
            console.warn('No nodes in scene! Loaded count:', this.loadedNodeCount);
        }

        this.nodes.forEach((node, index) => {
            // Update shader uniforms
            if (node.material && node.material.uniforms) {
                if (node.material.uniforms.audioStrength) {
                    node.material.uniforms.audioStrength.value = audioStrength;
                }
                if (node.material.uniforms.time) {
                    node.material.uniforms.time.value = performance.now() * 0.001;
                }
                // Dynamic contrast boost
                if (node.material.uniforms.contrast) {
                    // Base contrast 1.0, boosts up to 2.5 on loud beats
                    node.material.uniforms.contrast.value = 1.0 + audioStrength * 1.5;
                }
            }
            // Animate opacity
            if (node.userData.currentOpacity !== undefined && node.userData.targetOpacity !== undefined) {
                const opacityDiff = Math.abs(node.userData.currentOpacity - node.userData.targetOpacity);
                if (opacityDiff > 0.01) {
                    node.userData.currentOpacity = THREE.MathUtils.lerp(
                        node.userData.currentOpacity,
                        node.userData.targetOpacity,
                        0.1 // Animation speed
                    );
                    if (node.material && node.material.uniforms && node.material.uniforms.opacity) {
                        node.material.uniforms.opacity.value = node.userData.currentOpacity;
                    }
                    needsUpdate = true;
                }
                node.visible = node.userData.currentOpacity > 0.01;
            }

            node.lookAt(this.camera.position);

            // Scale interpolation (Audio pulse + original scale)
            if (node.userData.originalScale) {
                let targetScaleX = node.userData.originalScale.x;
                let targetScaleY = node.userData.originalScale.y;

                if (this.isAudioActive) {
                    // Only apply individual variation if there is audio strength (big noise)
                    // This prevents "breathing" animation during silence
                    const individualFactor = 1.0 + Math.sin(Date.now() * 0.01 + node.userData.id) * 0.1 * audioStrength;

                    targetScaleX *= audioScale * individualFactor;
                    targetScaleY *= audioScale * individualFactor;

                    node.scale.x += (targetScaleX - node.scale.x) * 0.2;
                    node.scale.y += (targetScaleY - node.scale.y) * 0.2;
                } else {
                    node.scale.lerp(node.userData.originalScale, 0.1);
                }
            }

            // Animate position
            if (node.userData.targetPosition) {
                const dist = node.position.distanceTo(node.userData.targetPosition);
                if (dist > 0.1) {
                    // Use individual speed for organic transition
                    const speed = node.userData.moveSpeed || 0.03;
                    node.position.lerp(node.userData.targetPosition, speed);
                    needsUpdate = true;
                }
            }

            // Idle floating animation
            // Only apply floating if node is close to its target (not transitioning between layouts)
            if (this.isIdle && node.userData.targetPosition) {
                const distToTarget = node.position.distanceTo(node.userData.targetPosition);

                // Only float if we're close to the target position (within 5 units)
                if (distToTarget < 5) {
                    // Initialize idle offset when entering idle state
                    if (!node.userData.idleStartOffset) {
                        node.userData.idleStartOffset = {
                            x: node.position.x - node.userData.targetPosition.x,
                            y: node.position.y - node.userData.targetPosition.y,
                            z: node.position.z - node.userData.targetPosition.z
                        };
                        node.userData.idleStartTime = this.idleTime;
                    }

                    // Create gentle floating motion using sine waves
                    const floatSpeed = 0.3;
                    const floatAmount = 2;

                    // Calculate time since idle started for this node
                    const localIdleTime = this.idleTime - (node.userData.idleStartTime || 0);

                    // Fade in the floating animation over 1 second
                    const fadeInDuration = 1.0;
                    const fadeInProgress = Math.min(localIdleTime / fadeInDuration, 1.0);
                    const easedProgress = fadeInProgress * fadeInProgress; // Ease in

                    // Use node index for variation so each image floats differently
                    const targetOffsetX = Math.sin(this.idleTime * floatSpeed + index * 0.5) * floatAmount;
                    const targetOffsetY = Math.cos(this.idleTime * floatSpeed * 0.7 + index * 0.3) * floatAmount;
                    const targetOffsetZ = Math.sin(this.idleTime * floatSpeed * 0.5 + index * 0.7) * floatAmount * 0.5;

                    // Blend from start offset to target floating offset
                    const offsetX = node.userData.idleStartOffset.x * (1 - easedProgress) + targetOffsetX * easedProgress;
                    const offsetY = node.userData.idleStartOffset.y * (1 - easedProgress) + targetOffsetY * easedProgress;
                    const offsetZ = node.userData.idleStartOffset.z * (1 - easedProgress) + targetOffsetZ * easedProgress;

                    node.position.x = node.userData.targetPosition.x + offsetX;
                    node.position.y = node.userData.targetPosition.y + offsetY;
                    node.position.z = node.userData.targetPosition.z + offsetZ;

                    needsUpdate = true;
                } else {
                    // Clear idle offset if we're far from target (transitioning)
                    delete node.userData.idleStartOffset;
                    delete node.userData.idleStartTime;
                }
            } else if (!this.isIdle && node.userData.idleStartOffset) {
                // Clear idle offset when exiting idle state
                delete node.userData.idleStartOffset;
                delete node.userData.idleStartTime;
            }
        });

        // Smooth rotation interpolation (only when controlled by iPad, not manual controls)
        if (!this.userControlling && !this.isIdle) {
            const offset = new THREE.Vector3();
            offset.copy(this.camera.position).sub(this.controls.target);
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(offset);

            // Normalize current theta to match targetTheta's range (0 to 2π)
            let currentTheta = ((spherical.theta % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
            let targetTheta = this.targetTheta;

            // Find shortest path between angles to prevent spinning the long way
            let diff = targetTheta - currentTheta;
            if (diff > Math.PI) diff -= Math.PI * 2;
            if (diff < -Math.PI) diff += Math.PI * 2;

            spherical.theta = currentTheta + diff * 0.1; // Lerp with shortest path
            spherical.phi = THREE.MathUtils.lerp(spherical.phi, this.targetPhi, 0.1);
            offset.setFromSpherical(spherical);
            this.camera.position.copy(this.controls.target).add(offset);
            this.camera.lookAt(this.controls.target);
        } else if (this.userControlling) {
            // When user is controlling, sync targetTheta/targetPhi to current position
            // so iPad controller doesn't fight with manual controls
            const offset = new THREE.Vector3();
            offset.copy(this.camera.position).sub(this.controls.target);
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(offset);
            this.targetTheta = spherical.theta;
            this.targetPhi = spherical.phi;
        }

        // Update connections only when needed
        if (this.needsConnectionUpdate || needsUpdate) {
            this.updateConnections();
            this.needsConnectionUpdate = false;
        }

        this.renderer.render(this.scene, this.camera);
    }

    async toggleAudio() {
        if (this.isAudioActive) {
            this.stopAudio();
            return false;
        } else {
            await this.startAudio();
            return true;
        }
    }

    async startAudio() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256; // Resolution of frequency data
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            this.audioSource = this.audioContext.createMediaStreamSource(stream);
            this.audioSource.connect(this.analyser);
            // Note: Don't connect to destination (speakers) to avoid feedback loop

            this.isAudioActive = true;
            console.log('Audio reactivity started');
        } catch (error) {
            console.error('Error starting audio:', error);
            if (error.name === 'NotAllowedError' || error.message.includes('user gesture')) {
                alert('Please click anywhere on this screen to enable audio access, then try again from the controller.');
                // Add one-time click listener to resume context
                const resumeAudio = async () => {
                    if (this.audioContext && this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                        console.log('Audio context resumed by user gesture');
                    }
                    window.removeEventListener('click', resumeAudio);
                };
                window.addEventListener('click', resumeAudio);
            }
        }
    }

    stopAudio() {
        if (this.audioSource) {
            this.audioSource.disconnect();
            this.audioSource = null;
        }
        if (this.audioContext) {
            this.audioContext.suspend();
        }
        this.isAudioActive = false;

        // Reset nodes to original scale
        this.nodes.forEach(node => {
            if (node.userData.originalScale) {
                node.scale.copy(node.userData.originalScale);
            }
        });

        console.log('Audio reactivity stopped');
    }
}
