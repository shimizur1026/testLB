/**
 * Lesson Viewer v8.2 - Sharp Diagonal Edge (v18.0)
 */

document.addEventListener('DOMContentLoaded', () => {
    const app = new LessonViewer();
    app.init();
});

class LessonViewer {
    constructor() {
        this.appContainer = document.getElementById('app');
        this.modal = document.getElementById('modal-dialog');
        this.modalBody = document.getElementById('modal-body');
        this.closeModalBtn = document.getElementById('modal-close');
        this.soundToggleBtn = document.getElementById('sound-toggle');

        this.lessonData = null;
        this.currentPartIndex = 0;
        this.currentStep = 1;
        this.totalStepsCache = {};
        this.simTimeline = null;
        this.sectionCount = 0;
        this.audioMuted = true;
        this.chargeProgress = 0;
        this.chargeInterval = null;
        this.isChargingManually = false;
        this.masterLibrary = null;

        // v33.0: Paths are relative to lesson entry point
        this.lessonPath = './';
        this.libraryPath = '../master_library/';

        // Keep coursePath for any absolute references if needed, 
        // but primarily we use relative paths now.
        const params = new URLSearchParams(window.location.search);
        this.courseId = params.get('course') || 'challenger';
        this.lessonId = params.get('lesson') || 'lesson_03';

        this.initEventListeners();
        this.initParallax();
        this.initSoundToggle();

        window.addEventListener('mouseup', () => this.handleGlobalStopCharge());
        window.addEventListener('touchend', () => this.handleGlobalStopCharge());
    }

    handleGlobalStopCharge() {
        if (this.isChargingManually) {
            this.stopCharging();
        }
    }

    initSoundToggle() {
        this.soundToggleBtn.addEventListener('click', () => {
            this.audioMuted = !this.audioMuted;
            this.soundToggleBtn.classList.toggle('active', !this.audioMuted);
            const icon = this.soundToggleBtn.querySelector('i');
            icon.className = this.audioMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            this.playSound('se-click');
        });
    }

    playSound(id) {
        if (this.audioMuted) return;
        const el = document.getElementById(id);
        if (el) {
            el.currentTime = 0;
            el.play().catch(e => console.warn("Audio play blocked:", e));
        }
    }

    stopSound(id) {
        const el = document.getElementById(id);
        if (el) { el.pause(); el.currentTime = 0; }
    }

    async init() {
        try {
            // v35.0: Load robot.json along with other libraries
            const [lessonRes, learnRes, pointRes, missionRes, homeRes, footerRes, robotRes] = await Promise.all([
                fetch(`${this.lessonPath}lesson_data.json`),
                fetch(`${this.libraryPath}learn.json`),
                fetch(`${this.libraryPath}point.json`),
                fetch(`${this.libraryPath}mission.json`),
                fetch(`${this.libraryPath}home.json`),
                fetch(`${this.libraryPath}footer.json`),
                fetch(`${this.libraryPath}robot.json`)
            ]);

            this.lessonData = await lessonRes.json();
            this.masterLibrary = {
                learn: await learnRes.json(),
                point: await pointRes.json(),
                mission: await missionRes.json(),
                home: await homeRes.json(),
                footer: await footerRes.json(),
                robot: await robotRes.json()
            };

            await this.render();
            this.initGlobalAnimations();
            this.initScrollReveal();
        } catch (error) {
            console.error('Failed to load lesson data or library:', error);
            this.appContainer.innerHTML = `<div class="container"><div class="pop-card">データの読み込みに失敗しました。<br><small>${this.lessonPath}</small></div></div>`;
        }
    }

    // v34.0 Helper to resolve assets correctly from the lesson directory
    resolveAsset(path) {
        if (!path) return '';
        // Absolute or data URLs
        if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('/')) return path;

        // System assets at root level (3 levels up from courses/xxx/yyy/)
        if (path.startsWith('comp_model')) {
            return `../../../${path}`;
        }

        // v34.0: Common assets at course level (1 level up from lesson folder)
        if (path.startsWith('assets/')) {
            return `../${path}`;
        }

        // Lesson-specific assets (if any remain in the lesson folder)
        return `${this.lessonPath}${path}`;
    }

    initParallax() {
        window.addEventListener('scroll', () => {
            requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                document.documentElement.style.setProperty('--scroll-offset', scrolled);
            });
        });
    }

    initScrollReveal() {
        ScrollReveal().reveal('.reveal', {
            distance: '40px',
            duration: 1000,
            easing: 'cubic-bezier(0.5, 0, 0, 1)',
            interval: 100,
            mobile: true
        });
    }

    initEventListeners() {
        this.closeModalBtn.addEventListener('click', () => this.modal.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.modal.close();
        });
    }

    initGlobalAnimations() {
        anime({
            targets: '.hero-char',
            translateY: [-20, 20],
            rotate: [-3, 3],
            duration: 3000 + Math.random() * 2000,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine',
            delay: anime.stagger(500)
        });
    }

    async render() {
        this.appContainer.innerHTML = '';
        this.sectionCount = 0;
        const sections = this.lessonData.sections;

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];

            // Specific: Inject Mission Report before 'home' section (Ouchi Mission)
            if (section.type === 'home') {
                this.appContainer.appendChild(this.renderReportSection());

                // NEW: Wrap Ouchi Mission in a locked wrapper with Mechanical Lock
                const homeWrapper = document.createElement('div');
                homeWrapper.id = 'home-mission-wrapper';
                homeWrapper.className = 'home-mission-wrapper locked';

                // v16.3: Use separate content div for blurring to avoid lock blurring
                homeWrapper.innerHTML = `
                    <div class="lock-cover">
                        <div class="lock-icon-container">
                            <i class="fa-solid fa-square lock-body"></i>
                            <div class="lock-shackle"></div>
                        </div>
                        <p class="lock-text">MISSION REPORT を 送信して<br>ロックを かいじょ しよう</p>
                    </div>
                    <div class="home-mission-content"></div>
                `;

                const contentArea = homeWrapper.querySelector('.home-mission-content');
                const sectionEl = await this.createSection(section);
                sectionEl.classList.remove('reveal'); // Prevent ScrollReveal interference
                contentArea.appendChild(sectionEl);

                this.appContainer.appendChild(homeWrapper);
                continue;
            }

            // Type A: Icon Marquee injection before Mission Start
            if (section.type === 'mission_view') {
                const marquee = document.createElement('div');
                marquee.className = 'marquee-container marquee-alert';
                const text = `
                    MISSION START <i class="fa-solid fa-flag-checkered"></i>
                    ROBO DONE CHALLENGE <i class="fa-solid fa-robot"></i>
                `;
                marquee.innerHTML = `
                    <div class="marquee-content">${text.repeat(8)}</div>
                    <div class="marquee-content" aria-hidden="true">${text.repeat(8)}</div>
                `;
                this.appContainer.appendChild(marquee);
            }

            const sectionEl = await this.createSection(section);
            if (sectionEl) {
                if (this.sectionCount % 2 !== 0 && section.type === 'mission_view') {
                    sectionEl.classList.add('section-reverse');
                }
                this.appContainer.appendChild(sectionEl);
                this.sectionCount++;
            }
        }

        const loading = document.querySelector('.loading-screen');
        if (loading) loading.style.display = 'none';
    }

    async createSection(section) {
        const wrapper = document.createElement('section');
        wrapper.className = 'reveal';

        // Resolve Section-level ID if present (for mission, home, and build)
        if (section.id) {
            let category = section.type === 'mission_view' ? 'mission' : section.type;
            // v35.0: Map build to robot category in library
            if (category === 'build') category = 'robot';

            const shared = (this.masterLibrary[category] || []).find(c => c.id === section.id);
            if (shared) {
                // Merge shared data into section (existing keys in lesson_data win)
                Object.assign(section, { ...shared, ...section });
            }
        }

        switch (section.type) {
            case 'hero':
                wrapper.className = 'hero-section'; // Remove 'reveal' for LCP optimization
                const courseName = this.lessonData.courseName || 'COURSE';
                const lessonNum = this.lessonData.lessonNumber || '00';
                const mainTitle = this.lessonData.title || '';

                wrapper.innerHTML = `
                    <div class="texture-overlay"></div>
                    <div class="hero-content container">
                        <div class="hero-giant-num">${lessonNum}</div>
                        <div class="hero-badge">${courseName}</div>
                        <div class="hero-label">LESSON BOOK</div>
                        <h1 class="hero-main-title">${mainTitle}</h1>
                    </div>
                    ${(section.characters || []).map(char => `<img src="${this.resolveAsset(char.image)}" class="hero-char" style="top: ${char.initial.top}; left: ${char.initial.left};">`).join('')}
                `;
                return wrapper;

            case 'point':
                wrapper.innerHTML = `
                    <div class="container">
                        <h2 class="pop-title reveal">${section.title}</h2>
                        <div class="point-grid">
                            ${section.items.map(itemRef => {
                    const id = typeof itemRef === 'string' ? itemRef : itemRef.id;
                    const item = (this.masterLibrary.point || []).find(p => p.id === id) || { text: itemRef };
                    return `<div class="point-item reveal">${item.text}</div>`;
                }).join('')}
                        </div>
                    </div>
                `;
                return wrapper;

            case 'build':
                return await this.renderBuildSection(section);

            case 'learn':
                wrapper.innerHTML = `
                    <div class="container">
                        <h2 class="pop-title reveal">${section.title}</h2>
                        <div class="learn-grid">
                            ${section.items.map((itemRef, idx) => {
                    const componentId = typeof itemRef === 'string' ? itemRef : itemRef.id;
                    const item = (this.masterLibrary.learn || []).find(c => c.id === componentId) || { label: 'Unknown', icon: 'fa-solid fa-question', modalContent: 'Not found' };

                    return `
                                    <div class="item-card learn-item reveal" data-idx="${idx}">
                                        <div class="learn-icon-wrapper">
                                            <i class="${item.icon}"></i>
                                        </div>
                                        <div class="item-label">${item.label}</div>
                                    </div>
                                `;
                }).join('')}
                        </div>
                    </div>
                `;
                wrapper.querySelectorAll('.learn-item').forEach(el => {
                    el.addEventListener('click', () => {
                        const itemRef = section.items[el.dataset.idx];
                        const componentId = typeof itemRef === 'string' ? itemRef : itemRef.id;
                        const item = (this.masterLibrary.learn || []).find(c => c.id === componentId);
                        if (item) {
                            this.openModal(item.modalContent, item.modalType, item.label);
                        }
                    });
                });
                return wrapper;

            case 'mission_view':
                return this.renderMissionView(section);

            case 'home':
                wrapper.className = 'section-home reveal';
                wrapper.innerHTML = `
                    <div class="container home-content-wrapper">
                        <h2 class="pop-title reveal">${section.title}</h2>
                        
                        ${section.youtubeId ? `
                            <div class="video-wrapper reveal">
                                <iframe src="https://www.youtube.com/embed/${section.youtubeId}" frameborder="0" allowfullscreen></iframe>
                            </div>
                        ` : ''}

                        ${section.image ? `
                            <div class="home-image-wrapper reveal">
                                <img src="${this.resolveAsset(section.image)}" class="home-image" alt="Home Mission Image">
                            </div>
                        ` : ''}

                        ${section.text ? `
                            <div class="home-text-content reveal">
                                <p>${section.text}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
                return wrapper;

            case 'footer':
                wrapper.className = 'footer-section';
                wrapper.innerHTML = `
                    <div class="container footer-content">
                        <p>${this.masterLibrary.footer.copyright}</p>
                    </div>
                `;
                return wrapper;

            default:
                return null;
        }
    }

    async renderBuildSection(section) {
        const wrapper = document.createElement('section');
        wrapper.className = 'build-section reveal';
        wrapper.innerHTML = `
            <div class="container">
                <h2 class="pop-title reveal">${section.title}</h2>
                ${section.name ? `<p class="robot-name-label reveal">${section.name}</p>` : ''}
                
                <div class="model-wrapper">
                    <model-viewer 
                        src="${this.resolveAsset(section.model || 'assets/models/robot.glb')}" 
                        alt="${section.name || 'ロボット'}の3Dモデル"
                        auto-rotate 
                        camera-controls 
                        shadow-intensity="1" 
                        touch-action="pan-y">
                        <div slot="poster" class="model-poster">
                            <div class="spinner"></div>
                        </div>
                    </model-viewer>
                    <p class="model-caption"><i class="fa-solid fa-hand-pointer"></i> まわして みよう！</p>
                </div>

                <div class="parts-selector reveal">
                    ${section.parts.map((p, i) => `
                        <div class="part-tab" data-idx="${i}">
                            ${p.icon ? `<i class="${p.icon}"></i>` : ''}
                            <span>${p.label}</span>
                        </div>
                    `).join('')}
                </div>
                <div id="step-viewer" class="step-viewer reveal"></div>
            </div>
        `;

        const tabs = wrapper.querySelectorAll('.part-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = parseInt(e.currentTarget.dataset.idx);
                if (idx === this.currentPartIndex) return;

                console.log('Switching to part:', idx);
                this.currentPartIndex = idx;
                this.currentStep = 1;
                this.updateStepViewer();
            });
        });

        // Background Step Discovery (Non-blocking for LCP)
        section.parts.forEach(async (part, index) => {
            part.totalSteps = await this.discoverSteps(part);
            if (index === this.currentPartIndex) {
                this.updateStepViewer();
            }
        });

        setTimeout(() => this.updateStepViewer(), 0);
        return wrapper;
    }

    async discoverSteps(part) {
        const probeCount = 50;
        const probes = [];
        for (let i = 1; i <= probeCount; i++) {
            const url = this.resolveAsset(`${part.basePath}step-${i}.png`);
            probes.push(fetch(url, { method: 'HEAD' }).then(res => res.ok).catch(() => false));
        }

        const results = await Promise.all(probes);
        let count = 0;
        for (let i = 0; i < results.length; i++) {
            if (results[i]) count = i + 1;
            else break;
        }
        return count || 1;
    }

    updateStepViewer() {
        const viewer = document.getElementById('step-viewer');
        if (!viewer) return;
        const buildSection = this.lessonData.sections.find(s => s.type === 'build');
        const part = buildSection.parts[this.currentPartIndex];
        const totalSteps = part.totalSteps || 1;
        const imageUrl = this.resolveAsset(`${part.basePath}step-${this.currentStep}.png`);

        document.querySelectorAll('.part-tab').forEach((tab, i) => {
            if (i === this.currentPartIndex) tab.classList.add('active');
            else tab.classList.remove('active');
        });

        viewer.innerHTML = `
            <div class="step-image-container">
                <img id="step-img" src="${imageUrl}" style="opacity: 0; max-height: 100%; max-width: 100%; transition: opacity 0.3s ease;">
            </div>
            <div class="step-controls" style="display: flex; justify-content: center; align-items: center; gap: 40px;">
                <button class="btn-nav btn-prev" id="prev-step" ${this.currentStep === 1 ? 'disabled' : ''}>PREV</button>
                <div class="build-counter" style="color: var(--accent-color); font-family: var(--font-heading-en); font-weight: 900; font-size: 1.5rem;">${this.currentStep} / ${totalSteps}</div>
                <button class="btn-nav btn-next" id="next-step" ${this.currentStep === totalSteps ? 'disabled' : ''}>NEXT</button>
            </div>
        `;

        const img = viewer.querySelector('#step-img');
        const handleLoad = () => {
            img.style.opacity = 1;
        };

        if (img.complete) {
            handleLoad();
        } else {
            img.onload = handleLoad;
        }

        img.onerror = () => {
            console.error('Failed to load image:', imageUrl);
            img.style.opacity = 0.3; // Show semi-transparent if error
        };

        viewer.querySelector('#prev-step').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.currentStep > 1) { this.currentStep--; this.updateStepViewer(); }
        });
        viewer.querySelector('#next-step').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.currentStep < totalSteps) { this.currentStep++; this.updateStepViewer(); }
        });
    }

    renderReportSection() {
        const wrapper = document.createElement('section');
        wrapper.className = 'section-report reveal';
        wrapper.innerHTML = `
            <div class="container">
                <h2 class="pop-title" style="color: #fff; margin-bottom: 5px;">MISSION REPORT</h2>
                <p style="color: var(--accent-color); font-weight: 700; margin-bottom: 40px; text-align: center;">結果を送信して”おうちミッション”のカギをあけよう！</p>
                
                <div class="report-step step-result">
                    <p class="step-label">Q1. けっかは どうだった？</p>
                    <div class="step-options">
                        <button class="btn-option" data-step="1" data-val="success">せいこう！</button>
                        <button class="btn-option" data-step="1" data-val="close">おしかった</button>
                        <button class="btn-option" data-step="1" data-val="fail">しっぱい</button>
                    </div>
                </div>

                <div class="report-step step-grit">
                    <p class="step-label">Q2. あきらめずに がんばった？</p>
                    <div class="step-options">
                        <button class="btn-option" data-step="2" data-val="great">とてもがんばった</button>
                        <button class="btn-option" data-step="2" data-val="good">がんばった</button>
                        <button class="btn-option" data-step="2" data-val="poor">すこしたりなかった</button>
                    </div>
                </div>

                <div class="report-step step-submit" style="background: none; border: none; box-shadow: none; text-align: center; padding: 40px 0;">
                    <button id="btn-submit-report" class="btn-submit" disabled>
                        <span>送 信</span> <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        const submitBtn = wrapper.querySelector('#btn-submit-report');
        const options = wrapper.querySelectorAll('.btn-option');
        let q1Selected = false;
        let q2Selected = false;

        options.forEach(btn => {
            btn.addEventListener('click', () => {
                const step = btn.dataset.step;
                wrapper.querySelectorAll(`.btn-option[data-step="${step}"]`).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (step === "1") q1Selected = true;
                if (step === "2") q2Selected = true;

                if (q1Selected && q2Selected) {
                    submitBtn.disabled = false;
                }
                this.playSound('se-click');
            });
        });

        submitBtn.addEventListener('click', () => {
            if (submitBtn.classList.contains('sent')) return;

            this.playSound('se-success');
            submitBtn.disabled = true;
            submitBtn.classList.add('sending');
            submitBtn.innerHTML = '<span>送信中...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

            setTimeout(() => {
                submitBtn.classList.remove('sending');
                submitBtn.classList.add('sent');
                submitBtn.innerHTML = '<span>送信済み</span> <i class="fa-solid fa-check"></i>';
                this.triggerMechanicalUnlock();
            }, 1000);
        });

        return wrapper;
    }

    triggerMechanicalUnlock() {
        const wrapper = document.getElementById('home-mission-wrapper');
        if (!wrapper) return;

        // Sequence: Vibrate -> Snap -> Fall -> Reveal
        wrapper.classList.add('unlocking');
        this.playSound('se-charge'); // Use as a mechanical "winding" sound

        setTimeout(() => {
            this.playSound('se-success'); // Use as the "CLANK" sound
            wrapper.classList.remove('unlocking', 'locked');
            wrapper.classList.add('unlocked');

            // Screen Shake on body
            document.body.classList.add('shake-intense');
            setTimeout(() => document.body.classList.remove('shake-intense'), 500);
        }, 1500);
    }

    renderMissionView(section) {
        const wrapper = document.createElement('section');
        wrapper.className = 'mission-wrapper reveal';

        // v31.0: Determine display pattern and ratio
        const pattern = section.displayPattern || 'simulator'; // default
        const ratioClass = section.aspectRatio === 'square' ? 'ratio-square' : 'ratio-rectangle';

        let demoHtml = '';
        if (pattern === 'simulator') {
            demoHtml = `
                <div class="mission-demo reveal">
                    <div class="simulator-container ${ratioClass}" style="background: url('${this.resolveAsset(section.demoAnimation.background)}') center/cover;">
                        <div class="sensor-beam"></div>
                        <div class="sim-robot-container" style="position: absolute; width: 60px; height: 60px; top: 70%; left: 50%; transform: translateX(-50%);">
                            <img src="${this.resolveAsset(section.demoAnimation.robot)}" style="width: 100%;">
                        </div>
                        <div class="popup-text" style="left: 50%; top: 50%;">ピタッ！</div>
                    </div>
                </div>
            `;
        } else if (pattern === 'image_only' && section.image) {
            demoHtml = `
                <div class="mission-demo reveal">
                    <div class="mission-static-image-wrapper ${ratioClass}">
                        <img src="${this.resolveAsset(section.image)}" class="mission-static-image" alt="Mission Course">
                    </div>
                </div>
            `;
        }

        wrapper.innerHTML = `
            <div class="texture-overlay"></div>
            <div class="mission-bg-grid"></div>
            <div class="mission-watermark">MISSION</div>
            <div class="parallax-decor decor-1"></div>
            <div class="parallax-decor decor-2"></div>
            
            <div class="container" style="position: relative; z-index: 2;">
                <h2 class="pop-title reveal">MISSION</h2>
                <div class="mission-grid ${pattern === 'rules_only' ? 'rules-only-flow' : ''}">
                    <div class="mission-rules reveal">
                        <p class="mission-description">${section.description}</p>
                        <div class="mission-rules-grid">
                            ${section.rules.map(rule => `
                                <div class="mission-rule-card">
                                    <div class="rule-icon">${rule.icon}</div>
                                    <span>${rule.text}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ${demoHtml}
                </div>
            </div>
        `;

        // Only start animation if it's in simulator mode
        if (pattern === 'simulator') {
            setTimeout(() => this.startDemoAnimation(section.demoAnimation, wrapper), 100);
        }
        return wrapper;
    }

    showMotivation() {
        const texts = ['NICE TRY!', 'KEEP GOING!', "DON'T GIVE UP!", 'YOU CAN DO IT!'];
        const text = texts[Math.floor(Math.random() * texts.length)];
        const el = document.createElement('div');
        el.className = 'motivation-text animate-bounce-in';
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
    }

    startDemoAnimation(demo, container) {
        if (this.simTimeline) this.simTimeline.pause();

        const robot = container.querySelector('.sim-robot-container');
        const beam = container.querySelector('.sensor-beam');
        const popup = container.querySelector('.popup-text');
        if (!robot || !beam || !popup) return;

        // Initialize state
        anime.set(robot, { translateY: 0, translateX: '-50%' });
        anime.set(beam, { opacity: 0 });
        anime.set(popup, { opacity: 0, scale: 0.5 });

        this.simTimeline = anime.timeline({
            loop: true,
            easing: 'easeInOutQuad'
        });

        // Track current timeline position
        let currentTime = 0;
        let cumulativeY = 0;

        demo.timeline.forEach(step => {
            const duration = step.duration || 500;
            const easing = step.easing || 'easeInOutQuad';

            // Robot Movement
            if (step.action === 'move') {
                cumulativeY += step.y;
                this.simTimeline.add({
                    targets: robot,
                    translateY: cumulativeY,
                    translateX: '-50%',
                    duration: duration,
                    easing: easing
                }, currentTime);
            } else {
                // Wait/Stop - keep robot in place
                this.simTimeline.add({
                    targets: robot,
                    translateX: '-50%',
                    duration: duration
                }, currentTime);
            }

            // Effects (at the same time as the action)
            if (step.effect === 'sensor_beam_green' || step.effect === 'sensor_beam_red') {
                this.simTimeline.add({
                    targets: beam,
                    backgroundColor: step.effect === 'sensor_beam_green' ? '#4CAF50' : '#FF5252',
                    opacity: [0, 0.5, 0],
                    duration: duration,
                    easing: 'linear'
                }, currentTime);
            }
            else if (step.effect === 'popup_text') {
                this.simTimeline.add({
                    targets: popup,
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1.1, 1, 1],
                    duration: duration,
                    begin: () => { popup.textContent = step.text || 'HIT!'; }
                }, currentTime);
            }

            currentTime += duration;
        });

        // Add a small pause at the end of the loop
        this.simTimeline.add({
            targets: robot,
            duration: 1000
        });
    }

    openModal(content, type, title) {
        this.modalBody.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
            </div>
            <div class="modal-main">
                ${type === 'image' ? `<img src="${this.resolveAsset(content)}" class="modal-img">` : `
                    <div class="modal-text">
                        <p>${content}</p>
                    </div>
                `}
            </div>
        `;
        this.modal.showModal();
        this.playSound('se-click');
    }
}
