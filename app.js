const App = {
    currentPage: 'home',
    previousPage: null,
    userData: {
        name: '王阿姨',
        childName: '小宝',
        avatar: '👩'
    },
    tasks: [],
    activities: [],
    myActivities: [],
    history: [],
    currentQuestion: '',
    currentAnswer: null,
    currentTask: null,
    currentActivity: null,
    speechSynthesis: window.speechSynthesis,
    mediaStream: null,
    capturedPhoto: null,
    isRecording: false,
    recognition: null,
    recognitionStopped: false,
    learningStats: {
        totalQuestions: 0,
        streak: 0,
        lastDate: null,
        badges: []
    },
    
    defaultTasks: [
        { id: 1, name: '背古诗《春晓》', status: 'pending', desc: '和小宝一起背诵古诗', category: '语文', difficulty: '简单' },
        { id: 2, name: '数学口算', status: 'pending', desc: '完成10道口算题', category: '数学', difficulty: '简单' },
        { id: 3, name: '英语跟读', status: 'pending', desc: '跟读英语单词', category: '英语', difficulty: '中等' }
    ],
    
    defaultActivities: [
        { id: 1, title: '亲子手工活动', date: '2026-02-22', time: '14:00', location: '社区活动中心', participants: 12, maxParticipants: 20, desc: '和孩子一起制作手工灯笼', category: '手工' },
        { id: 2, title: '老年人健康讲座', date: '2026-02-25', time: '09:30', location: '社区会议室', participants: 28, maxParticipants: 50, desc: '春季养生知识讲座', category: '健康' },
        { id: 3, title: '儿童绘画比赛', date: '2026-02-28', time: '10:00', location: '朝阳公园', participants: 45, maxParticipants: 60, desc: '主题：我的家乡', category: '艺术' }
    ],
    
    init() {
        this.loadData();
        this.bindEvents();
        this.showPage('home');
        this.updateGreeting();
        this.checkDailyStreak();
    },
    
    loadData() {
        try {
            const savedData = localStorage.getItem('ylbt_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.userData = data.userData || this.userData;
                this.tasks = data.tasks || [...this.defaultTasks];
                this.activities = data.activities || [...this.defaultActivities];
                this.myActivities = data.myActivities || [];
                this.history = data.history || [];
                this.learningStats = data.learningStats || this.learningStats;
            } else {
                this.tasks = [...this.defaultTasks];
                this.activities = [...this.defaultActivities];
                this.myActivities = [];
                this.history = [];
            }
        } catch (e) {
            console.error('加载数据失败:', e);
            this.tasks = [...this.defaultTasks];
            this.activities = [...this.defaultActivities];
        }
    },
    
    saveData() {
        try {
            const data = {
                userData: this.userData,
                tasks: this.tasks,
                activities: this.activities,
                myActivities: this.myActivities,
                history: this.history,
                learningStats: this.learningStats
            };
            localStorage.setItem('ylbt_data', JSON.stringify(data));
        } catch (e) {
            console.error('保存数据失败:', e);
        }
    },
    
    checkDailyStreak() {
        const today = new Date().toDateString();
        if (this.learningStats.lastDate !== today) {
            const lastDate = this.learningStats.lastDate ? new Date(this.learningStats.lastDate) : null;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
                this.learningStats.streak++;
            } else if (lastDate && lastDate.toDateString() !== today) {
                this.learningStats.streak = 1;
            } else {
                this.learningStats.streak = 1;
            }
            this.learningStats.lastDate = today;
            this.saveData();
        }
    },
    
    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });
    },
    
    showPage(pageName, addToHistory = true) {
        this.previousPage = this.currentPage;
        this.currentPage = pageName;
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        
        const container = document.getElementById('page-container');
        container.innerHTML = this.getPageContent(pageName);
        
        this.bindPageEvents();
        
        if (pageName === 'home') {
            this.updateGreeting();
        }
        
        window.scrollTo(0, 0);
    },
    
    getPageContent(page) {
        const pages = {
            'home': this.getHomePage(),
            'voice-input': this.getVoiceInputPage(),
            'answer': this.getAnswerPage(),
            'share': this.getSharePage(),
            'tasks': this.getTasksPage(),
            'task-detail': this.getTaskDetailPage(),
            'task-complete': this.getTaskCompletePage(),
            'achievement': this.getAchievementPage(),
            'activities': this.getActivitiesPage(),
            'activity-detail': this.getActivityDetailPage(),
            'my-activities': this.getMyActivitiesPage(),
            'profile': this.getProfilePage(),
            'settings': this.getSettingsPage(),
            'history': this.getHistoryPage()
        };
        return pages[page] || pages['home'];
    },
    
    bindPageEvents() {
        document.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const param = e.currentTarget.dataset.param;
                this.handleAction(action, param);
            });
        });
        
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());
        }
        
        const photoUpload = document.getElementById('photo-upload');
        if (photoUpload) {
            photoUpload.addEventListener('click', () => this.openCamera());
        }
        
        const galleryUpload = document.getElementById('gallery-upload');
        if (galleryUpload) {
            galleryUpload.addEventListener('click', () => this.openGallery());
        }
        
        const cameraBtn = document.getElementById('camera-btn');
        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => this.capturePhoto());
        }
        
        const voiceConfirmBtn = document.getElementById('voice-confirm-btn');
        if (voiceConfirmBtn) {
            voiceConfirmBtn.addEventListener('click', () => this.startVoiceConfirm());
        }
        
        const textInput = document.getElementById('text-input');
        if (textInput) {
            textInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitTextQuestion();
                }
            });
        }
        
        const submitBtn = document.getElementById('submit-text');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitTextQuestion());
        }
        
        document.querySelectorAll('.toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.currentTarget.classList.toggle('active');
                this.saveSettings();
            });
        });
        
        const nameInput = document.getElementById('user-name-input');
        if (nameInput) {
            nameInput.value = this.userData.name;
            nameInput.addEventListener('change', (e) => {
                this.userData.name = e.target.value;
                this.saveData();
                this.showToast('已保存');
            });
        }
        
        const childNameInput = document.getElementById('child-name-input');
        if (childNameInput) {
            childNameInput.value = this.userData.childName;
            childNameInput.addEventListener('change', (e) => {
                this.userData.childName = e.target.value;
                this.saveData();
                this.showToast('已保存');
            });
        }
    },
    
    async toggleVoiceRecording() {
        if (this.isRecording) {
            this.stopVoiceRecording();
        } else {
            await this.startVoiceRecording();
        }
    },
    
    async startVoiceRecording() {
        const voiceBtn = document.getElementById('voice-btn');
        const statusText = document.getElementById('voice-status');
        const recognizedText = document.getElementById('recognized-text');
        const waveAnimation = document.getElementById('wave-animation');
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.showToast('您的浏览器不支持语音识别，请使用Chrome浏览器');
            return;
        }
        
        if (this.isRecording) {
            this.stopVoiceRecording();
            return;
        }
        
        try {
            if (statusText) statusText.textContent = '正在请求麦克风权限...';
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error('麦克风权限错误:', err);
            let errorMsg = '无法访问麦克风';
            if (err.name === 'NotAllowedError') {
                errorMsg = '请允许麦克风权限';
            } else if (err.name === 'NotFoundError') {
                errorMsg = '未找到麦克风设备';
            }
            if (statusText) statusText.textContent = errorMsg;
            this.showToast(errorMsg);
            return;
        }
        
        this.isRecording = true;
        this.currentQuestion = '';
        this.recognitionStopped = false;
        
        if (voiceBtn) {
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<span>⏹️</span><span class="voice-btn-text">停止</span>';
        }
        if (statusText) statusText.textContent = '正在聆听...';
        if (recognizedText) recognizedText.textContent = '请说话...';
        if (waveAnimation) waveAnimation.classList.add('active');
        
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'zh-CN';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        
        let finalTranscript = '';
        let timeoutId = null;
        
        const stopRecognition = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (this.recognition && !this.recognitionStopped) {
                this.recognitionStopped = true;
                try {
                    this.recognition.stop();
                } catch (e) {}
            }
        };
        
        timeoutId = setTimeout(() => {
            if (this.isRecording) {
                stopRecognition();
            }
        }, 15000);
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            const displayText = finalTranscript || interimTranscript;
            if (recognizedText) {
                recognizedText.textContent = displayText || '正在识别...';
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            if (timeoutId) clearTimeout(timeoutId);
            
            let errorMsg = '识别出错';
            if (event.error === 'no-speech') {
                errorMsg = '没有检测到语音，请重试';
            } else if (event.error === 'audio-capture') {
                errorMsg = '无法获取音频';
            } else if (event.error === 'network') {
                errorMsg = '网络错误，请检查网络连接';
            } else if (event.error === 'not-allowed') {
                errorMsg = '麦克风权限被拒绝';
            } else if (event.error === 'aborted') {
                errorMsg = '';
            }
            
            if (errorMsg) {
                if (statusText) statusText.textContent = errorMsg;
                this.showToast(errorMsg);
            }
            
            this.resetVoiceUI(voiceBtn, statusText, recognizedText, waveAnimation);
            this.isRecording = false;
        };
        
        this.recognition.onend = () => {
            if (timeoutId) clearTimeout(timeoutId);
            
            if (!this.isRecording) return;
            
            this.isRecording = false;
            this.resetVoiceUI(voiceBtn, statusText, recognizedText, waveAnimation);
            
            if (finalTranscript && finalTranscript.trim()) {
                this.currentQuestion = finalTranscript.trim();
                if (statusText) statusText.textContent = '识别完成！';
                if (recognizedText) recognizedText.textContent = this.currentQuestion;
                this.showToast('识别成功！');
                setTimeout(() => {
                    this.generateAIAnswer(this.currentQuestion);
                }, 800);
            } else {
                if (statusText) statusText.textContent = '没有识别到内容';
                if (recognizedText) recognizedText.textContent = '请点击按钮重试';
            }
        };
        
        try {
            this.recognition.start();
        } catch (err) {
            console.error('启动语音识别失败:', err);
            if (timeoutId) clearTimeout(timeoutId);
            this.showToast('启动失败，请重试');
            this.resetVoiceUI(voiceBtn, statusText, recognizedText, waveAnimation);
            this.isRecording = false;
        }
    },
    
    resetVoiceUI(voiceBtn, statusText, recognizedText, waveAnimation) {
        if (voiceBtn) {
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<span>🎤</span><span class="voice-btn-text">点击说话</span>';
        }
        if (waveAnimation) waveAnimation.classList.remove('active');
    },
    
    stopVoiceRecording() {
        this.isRecording = false;
        this.recognitionStopped = true;
        
        const voiceBtn = document.getElementById('voice-btn');
        const statusText = document.getElementById('voice-status');
        const recognizedText = document.getElementById('recognized-text');
        const waveAnimation = document.getElementById('wave-animation');
        
        if (waveAnimation) waveAnimation.classList.remove('active');
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }
        
        this.resetVoiceUI(voiceBtn, statusText, recognizedText, waveAnimation);
        
        if (this.currentQuestion && this.currentQuestion.trim()) {
            if (statusText) statusText.textContent = '识别完成！';
            this.showToast('识别成功！');
            setTimeout(() => {
                this.generateAIAnswer(this.currentQuestion.trim());
            }, 500);
        } else {
            if (statusText) statusText.textContent = '已取消';
        }
    },
    
    submitTextQuestion() {
        const textInput = document.getElementById('text-input');
        if (textInput && textInput.value.trim()) {
            this.currentQuestion = textInput.value.trim();
            this.showToast('正在生成答案...');
            this.generateAIAnswer(this.currentQuestion);
        } else {
            this.showToast('请输入问题');
        }
    },
    
    generateAIAnswer(question) {
        this.currentQuestion = question;
        this.currentAnswer = this.getAIAnswer(question);
        
        this.learningStats.totalQuestions++;
        this.learningStats.lastDate = new Date().toDateString();
        
        this.history.unshift({
            question: question,
            time: this.formatTime(new Date()),
            answer: this.currentAnswer
        });
        
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        
        this.saveData();
        this.showPage('answer');
    },
    
    getAIAnswer(question) {
        const q = question.toLowerCase();
        
        const answerDatabase = {
            '恐龙': {
                elder: '很久很久以前，地球上住着很多很多恐龙。后来有一块超级大的石头从天上掉下来，撞到了地球上，天气变得很冷很冷，恐龙们找不到吃的，就慢慢消失了。',
                child: '恐龙是因为一颗很大的陨石撞击地球，导致环境变化而灭绝的哦！科学家们还在研究更多的原因呢。',
                emoji: '🦖',
                category: '自然科学'
            },
            '天空': {
                elder: '天空是蓝色的是因为太阳光穿过空气的时候，蓝色的光最容易散开，所以我们看到的天空就是蓝色的。',
                child: '这是因为光的散射现象！太阳光里有七种颜色，蓝色光波长最短，最容易被空气散射，所以天空看起来是蓝色的。',
                emoji: '🌤️',
                category: '自然科学'
            },
            '月亮': {
                elder: '月亮本身不会发光，我们看到的月光是太阳照在月亮上的光。月亮绕着地球转，有时候太阳照到的地方多，有时候少，所以我们看到的月亮就会变大变小。',
                child: '这是因为月相变化！月亮绕地球公转，太阳照亮月球的不同部分，所以我们看到月亮有不同的形状。',
                emoji: '🌙',
                category: '自然科学'
            },
            '水': {
                elder: '水结冰是因为天气太冷了，水分子挤在一起不动了，就变成了硬硬的冰。等天气暖和了，它们又动起来，就变回水了。',
                child: '这是物质的三态变化！温度降低时，水分子运动减慢，排列成规则的晶体结构，就变成了冰。',
                emoji: '💧',
                category: '自然科学'
            },
            '彩虹': {
                elder: '彩虹是下雨后，太阳光穿过小雨滴，就像穿过小玻璃球一样，被分成了七种颜色，就变成了漂亮的彩虹。',
                child: '这是光的折射和反射现象！阳光进入水滴后发生折射，在水滴内部反射，再折射出来，就形成了彩虹。',
                emoji: '🌈',
                category: '自然科学'
            },
            '星星': {
                elder: '星星其实很大很大，只是离我们太远了，所以看起来很小。就像飞机在天上飞，看起来也很小一样。',
                child: '星星是遥远的恒星，它们像太阳一样会发光发热。因为距离地球非常远，所以看起来只是小小的光点。',
                emoji: '⭐',
                category: '自然科学'
            },
            '太阳': {
                elder: '太阳是一个超级大的火球，它一直在燃烧，给我们光和热。没有太阳，地球上就没有生命。',
                child: '太阳是一颗恒星，通过核聚变反应产生能量。它的表面温度约5500摄氏度，是地球能量的主要来源。',
                emoji: '☀️',
                category: '自然科学'
            },
            '云': {
                elder: '云是天上的水蒸气变成的。地上的水被太阳晒热了，变成水蒸气飞到天上，聚在一起就变成了云。',
                child: '云是由大量微小水滴或冰晶组成的。水蒸发成水蒸气上升，在高空遇冷凝结成小水滴，聚集成云。',
                emoji: '☁️',
                category: '自然科学'
            },
            '雨': {
                elder: '雨是云里的小水滴太多了，太重了，就掉下来变成雨。就像海绵吸满了水会滴下来一样。',
                child: '雨是水循环的一部分。云中的水滴聚集变大，当重量超过空气浮力时，就会降落形成雨。',
                emoji: '🌧️',
                category: '自然科学'
            },
            '雪': {
                elder: '雪是冬天的时候，天上的水蒸气冻成了小冰花，飘下来就是雪。每一片雪花都是六角形的。',
                child: '雪是大气中的水蒸气直接凝华成冰晶形成的。雪花形状多样，但都是六角对称结构。',
                emoji: '❄️',
                category: '自然科学'
            },
            '睡觉': {
                elder: '睡觉的时候身体在休息，把一天的疲劳都赶走。就像手机要充电一样，人也要睡觉充电。',
                child: '睡眠对身体很重要！大脑在睡眠中整理记忆，身体修复细胞，生长激素也在睡眠时分泌最多。',
                emoji: '😴',
                category: '人体科学'
            },
            '吃饭': {
                elder: '吃饭是为了给身体补充能量，就像汽车要加油才能跑一样。不吃饭就没有力气，身体也会生病。',
                child: '食物提供人体需要的营养素：碳水化合物提供能量，蛋白质帮助生长发育，维生素和矿物质维持身体健康。',
                emoji: '🍚',
                category: '人体科学'
            },
            '牙齿': {
                elder: '牙齿是用来咬东西的，要把食物咬碎才能吃下去。所以要好好刷牙，不然牙齿会坏掉。',
                child: '牙齿是人体最坚硬的器官，主要功能是咀嚼食物。人一生有两副牙齿：乳牙和恒牙。',
                emoji: '🦷',
                category: '人体科学'
            },
            '眼睛': {
                elder: '眼睛是用来看东西的，光线进到眼睛里，我们就能看见东西了。要保护好眼睛，不能看太久的手机。',
                child: '眼睛是视觉器官，光线通过角膜、晶状体进入眼球，在视网膜上成像，通过视神经传到大脑。',
                emoji: '👁️',
                category: '人体科学'
            },
            '心脏': {
                elder: '心脏就像一个水泵，不停地跳动，把血液送到全身。它一直在工作，所以我们活着。',
                child: '心脏是循环系统的核心，通过收缩和舒张将血液泵送到全身，输送氧气和营养物质。',
                emoji: '❤️',
                category: '人体科学'
            },
            '鸟': {
                elder: '鸟有翅膀，可以飞到天上去。它们的骨头是空的，很轻，所以能飞起来。',
                child: '鸟类是脊椎动物中唯一有羽毛的类群。它们的骨骼中空、有气囊系统，这些特征帮助它们飞行。',
                emoji: '🐦',
                category: '动物'
            },
            '鱼': {
                elder: '鱼住在水里，用鳃呼吸。它们没有脚，用尾巴和鳍游泳。',
                child: '鱼类用鳃呼吸水中的氧气，用鳍游泳和保持平衡。大多数鱼有鳞片保护身体。',
                emoji: '🐟',
                category: '动物'
            },
            '猫': {
                elder: '猫是很可爱的小动物，喜欢抓老鼠。它们的眼睛在晚上会发光，走路没有声音。',
                child: '猫是猫科动物，有敏锐的听觉和视觉。它们的肉垫使走路无声，是优秀的捕猎者。',
                emoji: '🐱',
                category: '动物'
            },
            '狗': {
                elder: '狗是人类的好朋友，很忠诚。它们能帮我们看家，还能帮警察抓坏人。',
                child: '狗是最早被驯化的动物之一，有很强的嗅觉和听觉。它们可以成为工作犬、导盲犬等。',
                emoji: '🐕',
                category: '动物'
            },
            '植物': {
                elder: '植物是从种子长出来的，需要阳光和水。它们不会动，但是也是活的。',
                child: '植物通过光合作用制造养分，是生态系统中的生产者。它们为动物提供食物和氧气。',
                emoji: '🌱',
                category: '植物'
            },
            '花': {
                elder: '花是植物开出来的，很漂亮，有各种颜色。蜜蜂喜欢在花上采蜜。',
                child: '花是植物的繁殖器官，通过吸引昆虫传粉来结出果实。花瓣的颜色和香味都是为了吸引传粉者。',
                emoji: '🌸',
                category: '植物'
            },
            '树': {
                elder: '树是很高的植物，可以活很久。树可以给我们遮阴，还能净化空气。',
                child: '树木是木本植物，有发达的根系和主干。它们通过光合作用吸收二氧化碳，释放氧气。',
                emoji: '🌳',
                category: '植物'
            },
            '飞机': {
                elder: '飞机是能在天上飞的交通工具，比汽车快很多。它有翅膀，靠发动机飞起来。',
                child: '飞机利用机翼产生的升力飞行。根据伯努利原理，机翼上方的气流速度快，产生升力。',
                emoji: '✈️',
                category: '科技'
            },
            '汽车': {
                elder: '汽车是在路上跑的交通工具，有四个轮子。它用汽油或电来开动。',
                child: '汽车通过发动机将燃料的化学能转化为机械能，驱动车轮转动。现代汽车有燃油车和电动车。',
                emoji: '🚗',
                category: '科技'
            },
            '电脑': {
                elder: '电脑是很聪明的机器，可以帮我们算数、画画、看视频。现在手机也是小电脑。',
                child: '电脑是能够存储和处理信息的电子设备。它由硬件和软件组成，可以执行各种程序。',
                emoji: '💻',
                category: '科技'
            },
            '手机': {
                elder: '手机可以打电话、发信息、看视频。现在手机什么都能做，很方便。',
                child: '智能手机是集通信、计算、娱乐于一体的设备。它有触摸屏、处理器和各种传感器。',
                emoji: '📱',
                category: '科技'
            },
            '地球': {
                elder: '地球是我们住的地方，是圆的像一个球。地球上有陆地和海洋，还有很多生命。',
                child: '地球是太阳系中第三颗行星，是目前已知唯一有生命的星球。它有大气层保护，表面71%是海洋。',
                emoji: '🌍',
                category: '地理'
            },
            '中国': {
                elder: '中国是我们的祖国，很大很大，有很多人。中国有五千年的历史，有很多名胜古迹。',
                child: '中国是世界上人口最多的国家之一，有悠久的历史和灿烂的文化。首都北京，有长城、故宫等世界遗产。',
                emoji: '🇨🇳',
                category: '地理'
            },
            '北京': {
                elder: '北京是中国的首都，有故宫、长城这些很有名的地方。很多人去北京旅游。',
                child: '北京是中国的政治、文化中心，有三千多年的历史。著名景点有故宫、长城、天坛等。',
                emoji: '🏛️',
                category: '地理'
            },
            '春节': {
                elder: '春节是中国最重要的节日，就是过年。大家会回家团圆，吃饺子，放鞭炮，很热闹。',
                child: '春节是农历新年，是中国最隆重的传统节日。人们贴春联、吃年夜饭、拜年、发红包。',
                emoji: '🧧',
                category: '文化'
            },
            '中秋': {
                elder: '中秋节是吃月饼、赏月的节日。传说月亮上有嫦娥和玉兔。',
                child: '中秋节在农历八月十五，是团圆的节日。人们吃月饼、赏月，纪念嫦娥奔月的传说。',
                emoji: '🥮',
                category: '文化'
            },
            '端午': {
                elder: '端午节是吃粽子的节日，还会赛龙舟。是为了纪念古代诗人屈原。',
                child: '端午节在农历五月初五，人们吃粽子、赛龙舟、挂艾草，纪念爱国诗人屈原。',
                emoji: '🐲',
                category: '文化'
            }
        };
        
        for (const key in answerDatabase) {
            if (q.includes(key)) {
                return answerDatabase[key];
            }
        }
        
        const keywords = {
            '为什么': '这是一个很好的问题！',
            '怎么': '让我来解释一下...',
            '什么': '让我告诉你这是什么...',
            '哪里': '让我来告诉你...',
            '谁': '这是一个有趣的问题！'
        };
        
        let prefix = '这是一个很好的问题！';
        for (const key in keywords) {
            if (q.includes(key)) {
                prefix = keywords[key];
                break;
            }
        }
        
        return {
            elder: `${prefix}这个问题很有趣，我们可以一起去书里或者网上找找答案，一起学习新知识！`,
            child: `${prefix}让我们一起去查找资料，学习更多知识吧！科学就是从提问开始的。`,
            emoji: '🤔',
            category: '探索'
        };
    },
    
    async startVoiceConfirm() {
        const voiceConfirmBtn = document.getElementById('voice-confirm-btn');
        if (!voiceConfirmBtn) return;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.showToast('您的浏览器不支持语音识别');
            return;
        }
        
        try {
            this.showToast('正在请求麦克风权限...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            this.showToast('请允许麦克风权限');
            return;
        }
        
        voiceConfirmBtn.innerHTML = '<span>🎤</span><span>正在听...</span>';
        voiceConfirmBtn.disabled = true;
        
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        
        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            if (result.includes('完成') || result.includes('好了') || result.includes('做完了')) {
                this.completeCurrentTask();
            } else {
                this.showToast('请说"完成了"来确认');
            }
            voiceConfirmBtn.innerHTML = '<span>🎤</span><span>语音确认</span>';
            voiceConfirmBtn.disabled = false;
        };
        
        recognition.onerror = () => {
            this.showToast('语音识别失败，请重试');
            voiceConfirmBtn.innerHTML = '<span>🎤</span><span>语音确认</span>';
            voiceConfirmBtn.disabled = false;
        };
        
        try {
            recognition.start();
        } catch (err) {
            this.showToast('启动失败，请重试');
            voiceConfirmBtn.innerHTML = '<span>🎤</span><span>语音确认</span>';
            voiceConfirmBtn.disabled = false;
        }
    },
    
    completeCurrentTask() {
        if (this.currentTask) {
            const task = this.tasks.find(t => t.id === this.currentTask.id);
            if (task) {
                task.status = 'completed';
                this.saveData();
            }
        }
        this.showToast('任务确认完成！');
        setTimeout(() => this.showPage('achievement'), 1000);
    },
    
    async openCamera() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            
            const cameraContainer = document.getElementById('camera-container');
            if (cameraContainer) {
                cameraContainer.innerHTML = `
                    <div class="camera-preview">
                        <video id="camera-video" autoplay playsinline style="width: 100%; border-radius: 12px;"></video>
                        <div style="display: flex; gap: 12px; margin-top: 16px;">
                            <button class="btn btn-outline" id="switch-camera-btn" style="flex: 1;">
                                🔄 切换摄像头
                            </button>
                            <button class="btn btn-primary" id="camera-btn" style="flex: 1;">
                                📷 拍照
                            </button>
                        </div>
                    </div>
                `;
                
                const video = document.getElementById('camera-video');
                video.srcObject = this.mediaStream;
                
                document.getElementById('camera-btn').addEventListener('click', () => this.capturePhoto());
                document.getElementById('switch-camera-btn').addEventListener('click', () => this.switchCamera());
            }
        } catch (err) {
            console.error('打开相机失败:', err);
            this.showToast('无法打开相机，请检查权限设置');
        }
    },
    
    async switchCamera() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        const video = document.getElementById('camera-video');
        const currentFacing = video && video.srcObject ? 'user' : 'environment';
        const newFacing = currentFacing === 'user' ? 'environment' : 'user';
        
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: newFacing },
                audio: false
            });
            video.srcObject = this.mediaStream;
        } catch (err) {
            this.showToast('切换摄像头失败');
        }
    },
    
    openGallery() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.capturedPhoto = event.target.result;
                    this.showPhotoPreview();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    },
    
    capturePhoto() {
        const video = document.getElementById('camera-video');
        if (!video) {
            this.showToast('请先打开相机');
            return;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        this.capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);
        this.stopCamera();
        this.showPhotoPreview();
        
        this.showToast('拍照成功！');
    },
    
    showPhotoPreview() {
        const cameraContainer = document.getElementById('camera-container');
        if (cameraContainer) {
            cameraContainer.innerHTML = `
                <div class="photo-preview">
                    <img src="${this.capturedPhoto}" style="width: 100%; border-radius: 12px;" alt="拍摄的照片">
                    <div style="display: flex; gap: 12px; margin-top: 16px;">
                        <button class="btn btn-outline" onclick="App.openCamera()" style="flex: 1;">
                            🔄 重拍
                        </button>
                        <button class="btn btn-primary" data-action="confirm-photo" style="flex: 1;">
                            ✓ 确认
                        </button>
                    </div>
                </div>
            `;
            this.bindPageEvents();
        }
    },
    
    stopCamera() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
    },
    
    speakText(text) {
        if (!this.speechSynthesis) {
            this.showToast('您的浏览器不支持语音播报');
            return;
        }
        
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
        utterance.pitch = 1;
        
        this.speechSynthesis.speak(utterance);
        this.showToast('正在朗读...');
    },
    
    handleAction(action, param) {
        switch(action) {
            case 'go-back':
                this.stopCamera();
                if (this.isRecording) this.stopVoiceRecording();
                if (this.previousPage) {
                    this.showPage(this.previousPage);
                } else {
                    this.showPage('home');
                }
                break;
            case 'go-home':
                this.stopCamera();
                if (this.isRecording) this.stopVoiceRecording();
                this.showPage('home');
                break;
            case 'start-voice':
                this.showPage('voice-input');
                break;
            case 'show-answer':
                this.showPage('answer');
                break;
            case 'show-share':
                this.showPage('share');
                break;
            case 'show-task':
                const taskId = parseInt(param);
                this.currentTask = this.tasks.find(t => t.id === taskId) || this.tasks[0];
                this.showPage('task-detail');
                break;
            case 'complete-task':
                this.showPage('task-complete');
                break;
            case 'confirm-photo':
                this.completeCurrentTask();
                break;
            case 'show-achievement':
                this.stopCamera();
                this.showPage('achievement');
                break;
            case 'show-activity':
                const activityId = parseInt(param);
                this.currentActivity = this.activities.find(a => a.id === activityId) || this.activities[0];
                this.showPage('activity-detail');
                break;
            case 'show-my-activities':
                this.showPage('my-activities');
                break;
            case 'join-activity':
                this.joinActivity();
                break;
            case 'checkin-activity':
                this.checkinActivity();
                break;
            case 'play-voice':
                this.speakText('妈，今天降温，记得给小宝加衣服');
                break;
            case 'play-answer-voice':
                if (this.currentAnswer && this.currentAnswer.elder) {
                    this.speakText(this.currentAnswer.elder);
                }
                break;
            case 'play-animation':
                this.showToast('正在播放动画...');
                break;
            case 'share-result':
                this.shareResult();
                break;
            case 'take-photo':
                this.openCamera();
                break;
            case 'show-history':
                this.showPage('history');
                break;
            case 'show-settings':
                this.showPage('settings');
                break;
            case 'clear-history':
                this.clearHistory();
                break;
            case 'reset-tasks':
                this.resetTasks();
                break;
        }
    },
    
    joinActivity() {
        if (!this.currentActivity) return;
        
        const activity = this.activities.find(a => a.id === this.currentActivity.id);
        if (!activity) return;
        
        if (activity.participants >= activity.maxParticipants) {
            this.showToast('活动已满员');
            return;
        }
        
        const alreadyJoined = this.myActivities.some(a => a.id === activity.id);
        if (alreadyJoined) {
            this.showToast('您已报名过此活动');
            return;
        }
        
        activity.participants++;
        this.myActivities.push({
            ...activity,
            joinedAt: new Date().toISOString(),
            status: 'registered'
        });
        
        this.saveData();
        this.showToast('报名成功！');
        
        setTimeout(() => {
            this.showPage('my-activities');
        }, 1000);
    },
    
    checkinActivity() {
        if (!this.currentActivity) return;
        
        const myActivity = this.myActivities.find(a => a.id === this.currentActivity.id);
        if (myActivity) {
            myActivity.status = 'checked-in';
            myActivity.checkedInAt = new Date().toISOString();
            this.saveData();
            this.showToast('签到成功！');
        }
    },
    
    shareResult() {
        if (navigator.share) {
            navigator.share({
                title: '银龄伴童 - 今日学习',
                text: `${this.userData.name}今天学习了"${this.currentQuestion}"，和${this.userData.childName}一起成长！`,
                url: window.location.href
            }).catch(() => {});
        } else {
            this.showToast('已复制分享内容');
        }
    },
    
    clearHistory() {
        this.history = [];
        this.saveData();
        this.showToast('历史记录已清空');
        this.showPage('profile');
    },
    
    resetTasks() {
        this.tasks = this.defaultTasks.map(t => ({...t, status: 'pending'}));
        this.saveData();
        this.showToast('任务已重置');
        this.showPage('tasks');
    },
    
    saveSettings() {
        this.saveData();
    },
    
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        if (diff < 172800000) return '昨天';
        
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    },
    
    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = '您好';
        if (hour < 6) greeting = '夜深了';
        else if (hour < 12) greeting = '上午好';
        else if (hour < 14) greeting = '中午好';
        else if (hour < 18) greeting = '下午好';
        else greeting = '晚上好';
        
        const greetingEl = document.querySelector('.greeting-text');
        if (greetingEl) {
            greetingEl.textContent = `${greeting}，${this.userData.name} 🌞`;
        }
    },
    
    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 6) return '夜深了';
        if (hour < 12) return '上午好';
        if (hour < 14) return '中午好';
        if (hour < 18) return '下午好';
        return '晚上好';
    },
    
    getDateStr() {
        const now = new Date();
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        return `${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`;
    },
    
    showToast(message) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    },
    
    getHomePage() {
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const totalTasks = this.tasks.length;
        const progress = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
        
        return `
            <div class="page active">
                <div class="greeting">
                    <div class="greeting-text">${this.getGreeting()}，${this.userData.name} 🌞</div>
                    <div class="greeting-date">${this.getDateStr()}</div>
                </div>
                
                <div class="voice-btn-container">
                    <button class="voice-btn" data-action="start-voice">
                        <span>🎤</span>
                        <span class="voice-btn-text">问问题</span>
                    </button>
                </div>
                
                <div class="card">
                    <div class="card-title">📋 今日任务（${completedTasks}/${totalTasks}）</div>
                    ${this.tasks.slice(0, 3).map(task => `
                        <div class="task-item" data-action="show-task" data-param="${task.id}">
                            <div class="task-status ${task.status === 'completed' ? 'completed' : task.status === 'in-progress' ? 'in-progress' : 'pending'}">
                                ${task.status === 'completed' ? '✓' : task.status === 'in-progress' ? '▶' : '○'}
                            </div>
                            <div class="task-content">
                                <div class="task-name">${task.name}</div>
                                <div class="task-desc">${task.desc}</div>
                            </div>
                        </div>
                    `).join('')}
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">完成进度 ${progress}%</div>
                </div>
                
                <div class="card message-card">
                    <div class="card-title">💬 女儿留言</div>
                    <div class="message-content">"妈，今天降温，记得给小宝加衣服"</div>
                    <div class="message-action" data-action="play-voice">
                        <span>🔊</span>
                        <span>播放语音</span>
                    </div>
                </div>
                
                <div class="history-section">
                    <div class="history-title">📚 最近问答</div>
                    ${this.history.length > 0 ? this.history.slice(0, 3).map(item => `
                        <div class="history-item" data-action="show-answer">
                            <div class="history-icon">❓</div>
                            <div class="history-content">
                                <div class="history-question">${item.question}</div>
                                <div class="history-time">${item.time}</div>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state" style="padding: 24px; text-align: center;">
                            <div class="empty-icon">📝</div>
                            <div class="empty-desc">还没有问答记录</div>
                        </div>
                    `}
                </div>
                
                <div class="stats-bar">
                    <div class="stat-item">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-value">${this.learningStats.streak}</div>
                        <div class="stat-label">连续天数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">📚</div>
                        <div class="stat-value">${this.learningStats.totalQuestions}</div>
                        <div class="stat-label">学习次数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value">${completedTasks}</div>
                        <div class="stat-label">完成任务</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    getVoiceInputPage() {
        const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                </div>
                
                <div class="status-text" id="voice-status">点击按钮开始说话</div>
                
                <div class="voice-btn-container">
                    <button class="voice-btn" id="voice-btn">
                        <span>🎤</span>
                        <span class="voice-btn-text">点击说话</span>
                    </button>
                </div>
                
                <div class="wave-animation" id="wave-animation">
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                </div>
                
                <div id="recognized-text" style="text-align: center; font-size: var(--font-body); color: var(--color-text); min-height: 60px; padding: 16px; background: var(--color-white); border-radius: var(--radius-md); margin: 16px 0;">
                    识别结果将显示在这里...
                </div>
                
                <div class="card" style="margin-top: 16px;">
                    <div class="card-title">✏️ 或者输入文字</div>
                    <input type="text" id="text-input" placeholder="请输入您的问题..." style="width: 100%; padding: 16px; font-size: var(--font-body); border: 2px solid var(--color-border); border-radius: var(--radius-md); outline: none;">
                    <button class="btn btn-primary" id="submit-text" style="margin-top: 12px;">
                        提交问题
                    </button>
                </div>
                
                ${!hasSpeechRecognition ? `
                    <div style="text-align: center; padding: 16px; background: #FFF0F0; border-radius: var(--radius-md); margin-top: 16px; border: 2px solid var(--color-error);">
                        <p style="color: var(--color-error); font-size: var(--font-body); margin-bottom: 8px;">
                            ⚠️ 您的浏览器不支持语音识别
                        </p>
                        <p style="color: var(--color-text-light); font-size: var(--font-small);">
                            请使用 Chrome、Edge 或 Safari 浏览器，或使用上方文字输入
                        </p>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 12px; color: var(--color-text-light); font-size: var(--font-small);">
                        💡 提示：点击按钮开始录音，说完后自动识别
                    </div>
                `}
            </div>
        `;
    },
    
    getAnswerPage() {
        const answer = this.currentAnswer || {
            elder: '这是一个很好的问题！',
            child: '让我们一起去探索答案吧！',
            emoji: '🤔',
            category: '探索'
        };
        
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                    <div class="header-title" style="font-size: 18px; flex: 1; text-align: center; margin-right: 60px;">问答结果</div>
                </div>
                
                <div class="question-display">
                    <div class="question-icon">❓</div>
                    <div class="question-text">${this.currentQuestion || '问题'}</div>
                    ${answer.category ? `<div class="question-category">${answer.category}</div>` : ''}
                </div>
                
                <div class="answer-container">
                    <div class="answer-panel">
                        <div class="answer-panel-title">👵 给奶奶的话</div>
                        <div class="answer-text" style="line-height: 1.8;">
                            ${answer.elder}
                        </div>
                        <button class="play-btn" data-action="play-answer-voice">
                            <span>🔊</span>
                            <span>语音朗读</span>
                        </button>
                    </div>
                    
                    <div class="answer-panel">
                        <div class="answer-panel-title">👦 给${this.userData.childName}看的</div>
                        <div class="answer-media">
                            <div class="answer-media-icon">${answer.emoji}</div>
                            <div class="answer-media-text" style="margin: 12px 0; padding: 12px; background: var(--color-bg); border-radius: var(--radius-md); font-size: var(--font-small);">
                                ${answer.child}
                            </div>
                            <button class="play-btn" data-action="play-animation">
                                <span>▶️</span>
                                <span>播放动画</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 24px;">
                    <button class="btn btn-primary btn-lg" data-action="show-share">
                        学会了！教${this.userData.childName}去 👉
                    </button>
                </div>
            </div>
        `;
    },
    
    getSharePage() {
        const answer = this.currentAnswer || { emoji: '🦖' };
        
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                </div>
                
                <div class="share-card">
                    <div class="share-title">🎉 今日共学卡片</div>
                    <div class="share-icon">${answer.emoji}</div>
                    <div class="share-message">
                        ${this.userData.name}今天学习了<br>
                        <strong>"${this.currentQuestion || '新知识'}"</strong><br>
                        和${this.userData.childName}一起成长！
                    </div>
                </div>
                
                <div class="achievement-grid">
                    <div class="achievement-item">
                        <div class="achievement-icon">📚</div>
                        <div class="achievement-count">${this.learningStats.totalQuestions}</div>
                        <div class="achievement-label">学习次数</div>
                    </div>
                    <div class="achievement-item">
                        <div class="achievement-icon">🔥</div>
                        <div class="achievement-count">${this.learningStats.streak}</div>
                        <div class="achievement-label">连续天数</div>
                    </div>
                    <div class="achievement-item">
                        <div class="achievement-icon">✅</div>
                        <div class="achievement-count">${this.tasks.filter(t => t.status === 'completed').length}</div>
                        <div class="achievement-label">完成任务</div>
                    </div>
                </div>
                
                <div style="margin-top: 24px;">
                    <button class="btn btn-primary btn-lg" data-action="share-result">
                        分享给家人 📱
                    </button>
                </div>
                
                <div style="margin-top: 16px;">
                    <button class="btn btn-outline btn-lg" data-action="go-home">
                        返回首页
                    </button>
                </div>
            </div>
        `;
    },
    
    getTasksPage() {
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const totalTasks = this.tasks.length;
        const progress = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
        
        return `
            <div class="page active">
                <div class="header">
                    <div class="header-title">📋 今日任务</div>
                    <button class="btn btn-outline" data-action="reset-tasks" style="padding: 8px 16px; height: auto; font-size: 14px;">
                        重置
                    </button>
                </div>
                
                <div class="progress-card">
                    <div class="progress-circle" style="--progress: ${progress}">
                        <div class="progress-inner">
                            <div class="progress-value">${progress}%</div>
                        </div>
                    </div>
                    <div class="progress-info">
                        <div class="progress-title">今日进度</div>
                        <div class="progress-detail">已完成 ${completedTasks}/${totalTasks} 个任务</div>
                    </div>
                </div>
                
                ${this.tasks.map(task => `
                    <div class="task-card ${task.status}" data-action="show-task" data-param="${task.id}">
                        <div class="task-header">
                            <div class="task-status-icon ${task.status}">
                                ${task.status === 'completed' ? '✓' : task.status === 'in-progress' ? '▶' : '○'}
                            </div>
                            <div class="task-info">
                                <div class="task-name">${task.name}</div>
                                <div class="task-meta">
                                    <span class="task-category">${task.category || '学习'}</span>
                                    <span class="task-difficulty">${task.difficulty || '简单'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="task-desc">${task.desc}</div>
                    </div>
                `).join('')}
                
                <div class="card message-card" style="margin-top: 16px;">
                    <div class="card-title">💬 女儿留言</div>
                    <div class="message-content">"妈，今天降温，记得给小宝加衣服"</div>
                    <div class="message-action" data-action="play-voice">
                        <span>🔊</span>
                        <span>播放语音</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getTaskDetailPage() {
        const task = this.currentTask || this.tasks[0] || { name: '任务', desc: '任务描述', category: '学习', difficulty: '简单' };
        
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                </div>
                
                <div class="detail-header">
                    <div class="detail-icon">${task.category === '语文' ? '📖' : task.category === '数学' ? '🔢' : task.category === '英语' ? '🔤' : '📝'}</div>
                    <div class="detail-title">${task.name}</div>
                    <div class="detail-subtitle">${task.desc}</div>
                    <div class="detail-tags">
                        <span class="tag">${task.category || '学习'}</span>
                        <span class="tag">${task.difficulty || '简单'}</span>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">📝 任务要求</div>
                    <div class="detail-content">
                        帮助${this.userData.childName}完成${task.name}，耐心指导，多鼓励表扬。
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">💡 建议做法</div>
                    <div class="step-list">
                        <div class="step-item">
                            <div class="step-number">1</div>
                            <div class="step-content">找一个安静的地方，和${this.userData.childName}一起坐好</div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">2</div>
                            <div class="step-content">准备好需要的学习用品</div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">3</div>
                            <div class="step-content">让${this.userData.childName}自己做，做对了要表扬</div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">4</div>
                            <div class="step-content">完成后拍照上传，告诉妈妈</div>
                        </div>
                    </div>
                </div>
                
                <button class="btn btn-primary btn-lg" data-action="complete-task" style="margin-top: 16px;">
                    完成任务 ✓
                </button>
            </div>
        `;
    },
    
    getTaskCompletePage() {
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                </div>
                
                <div class="detail-header">
                    <div class="detail-icon">📸</div>
                    <div class="detail-title">完成任务</div>
                    <div class="detail-subtitle">拍照或语音确认完成</div>
                </div>
                
                <div class="card">
                    <div class="card-title">📷 拍照上传</div>
                    <div id="camera-container">
                        <div style="display: flex; gap: 12px;">
                            <div class="photo-upload" id="photo-upload" style="flex: 1;">
                                <div class="photo-upload-icon">📷</div>
                                <div class="photo-upload-text">拍照</div>
                            </div>
                            <div class="photo-upload" id="gallery-upload" style="flex: 1;">
                                <div class="photo-upload-icon">🖼️</div>
                                <div class="photo-upload-text">相册</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">🎤 语音确认</div>
                    <p style="color: var(--color-text-light); margin-bottom: 16px;">
                        如果不方便拍照，可以说"完成了"来确认
                    </p>
                    <button class="btn btn-outline btn-lg" id="voice-confirm-btn">
                        <span>🎤</span>
                        <span>语音确认</span>
                    </button>
                </div>
            </div>
        `;
    },
    
    getAchievementPage() {
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                </div>
                
                <div class="share-card">
                    <div class="share-title">🏆 今日成就</div>
                    <div class="share-icon">🎉</div>
                    <div class="share-message">
                        ${this.userData.name}今天完成了<br>
                        <strong>${completedTasks}个任务</strong><br>
                        太棒了！
                    </div>
                </div>
                
                <div class="achievement-grid">
                    <div class="achievement-item">
                        <div class="achievement-icon">📚</div>
                        <div class="achievement-count">${completedTasks}</div>
                        <div class="achievement-label">完成任务</div>
                    </div>
                    <div class="achievement-item">
                        <div class="achievement-icon">⏰</div>
                        <div class="achievement-count">${Math.floor(Math.random() * 30 + 15)}</div>
                        <div class="achievement-label">学习分钟</div>
                    </div>
                    <div class="achievement-item">
                        <div class="achievement-icon">❓</div>
                        <div class="achievement-count">${this.learningStats.totalQuestions}</div>
                        <div class="achievement-label">回答问题</div>
                    </div>
                </div>
                
                <div class="card" style="margin-top: 24px;">
                    <div class="card-title">📊 已同步给</div>
                    <div class="participants">
                        <div class="participant-avatars">
                            <div class="participant-avatar">👩</div>
                            <div class="participant-avatar">👧</div>
                        </div>
                        <div class="participant-count">女儿、${this.userData.childName}已收到通知</div>
                    </div>
                </div>
                
                <button class="btn btn-primary btn-lg" data-action="share-result" style="margin-top: 16px;">
                    分享给家人 📱
                </button>
                
                <button class="btn btn-outline btn-lg" data-action="go-home" style="margin-top: 16px;">
                    返回首页
                </button>
            </div>
        `;
    },
    
    getActivitiesPage() {
        return `
            <div class="page active">
                <div class="header">
                    <div class="header-title">🎉 社区活动</div>
                    <button class="btn btn-outline" data-action="show-my-activities" style="padding: 8px 16px; height: auto; font-size: 16px;">
                        我的活动
                    </button>
                </div>
                
                ${this.activities.map(activity => {
                    const date = new Date(activity.date);
                    const isExpired = date < new Date();
                    const isFull = activity.participants >= activity.maxParticipants;
                    const isJoined = this.myActivities.some(a => a.id === activity.id);
                    
                    return `
                        <div class="activity-item ${isExpired ? 'expired' : ''}" data-action="show-activity" data-param="${activity.id}">
                            <div class="activity-date">
                                <div class="activity-date-day">${date.getDate()}</div>
                                <div class="activity-date-month">${date.getMonth() + 1}月</div>
                            </div>
                            <div class="activity-info">
                                <div class="activity-title">${activity.title}</div>
                                <div class="activity-meta">
                                    <span>🕐 ${activity.time}</span>
                                    <span>📍 ${activity.location}</span>
                                </div>
                                <div class="activity-status">
                                    ${isJoined ? '<span class="badge badge-success">已报名</span>' : ''}
                                    ${isFull ? '<span class="badge badge-warning">已满员</span>' : ''}
                                    ${isExpired ? '<span class="badge badge-default">已结束</span>' : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    getActivityDetailPage() {
        const activity = this.currentActivity || this.activities[0];
        if (!activity) return this.getActivitiesPage();
        
        const date = new Date(activity.date);
        const isExpired = date < new Date();
        const isFull = activity.participants >= activity.maxParticipants;
        const isJoined = this.myActivities.some(a => a.id === activity.id);
        
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                </div>
                
                <div class="detail-header">
                    <div class="detail-icon">${activity.category === '手工' ? '🎨' : activity.category === '健康' ? '💪' : activity.category === '艺术' ? '🖼️' : '🎉'}</div>
                    <div class="detail-title">${activity.title}</div>
                    <div class="detail-subtitle">${activity.desc}</div>
                </div>
                
                <div class="card">
                    <div class="card-title">📅 活动时间</div>
                    <div class="detail-content">
                        ${date.getMonth() + 1}月${date.getDate()}日（周${['日','一','二','三','四','五','六'][date.getDay()]}）${activity.time}
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">📍 活动地点</div>
                    <div class="detail-content">
                        ${activity.location}
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">📝 活动内容</div>
                    <div class="detail-content">
                        ${activity.desc}
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">👥 报名情况</div>
                    <div class="participants">
                        <div class="participant-avatars">
                            ${Array(Math.min(4, activity.participants)).fill().map(() => `
                                <div class="participant-avatar">👤</div>
                            `).join('')}
                        </div>
                        <div class="participant-count">已有${activity.participants}人报名，限${activity.maxParticipants}人</div>
                    </div>
                    <div class="progress-bar" style="margin-top: 12px;">
                        <div class="progress-fill" style="width: ${activity.participants / activity.maxParticipants * 100}%"></div>
                    </div>
                </div>
                
                ${isJoined ? `
                    <button class="btn btn-outline btn-lg" data-action="checkin-activity" style="margin-top: 16px;">
                        🎫 签到入场
                    </button>
                ` : isExpired ? `
                    <button class="btn btn-outline btn-lg disabled" style="margin-top: 16px;" disabled>
                        活动已结束
                    </button>
                ` : isFull ? `
                    <button class="btn btn-outline btn-lg disabled" style="margin-top: 16px;" disabled>
                        已满员
                    </button>
                ` : `
                    <button class="btn btn-primary btn-lg" data-action="join-activity" style="margin-top: 16px;">
                        立即报名 ✓
                    </button>
                `}
            </div>
        `;
    },
    
    getMyActivitiesPage() {
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                    <div class="header-title">我的活动</div>
                </div>
                
                ${this.myActivities.length > 0 ? `
                    <div class="card">
                        <div class="card-title">✅ 已报名活动</div>
                        ${this.myActivities.map(activity => {
                            const date = new Date(activity.date);
                            return `
                                <div class="activity-item" data-action="show-activity" data-param="${activity.id}">
                                    <div class="activity-date">
                                        <div class="activity-date-day">${date.getDate()}</div>
                                        <div class="activity-date-month">${date.getMonth() + 1}月</div>
                                    </div>
                                    <div class="activity-info">
                                        <div class="activity-title">${activity.title}</div>
                                        <div class="activity-meta">
                                            <span>🕐 ${activity.time}</span>
                                            <span class="badge ${activity.status === 'checked-in' ? 'badge-success' : 'badge-warning'}">
                                                ${activity.status === 'checked-in' ? '已签到' : '已报名'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="card">
                        <div class="card-title">🎫 签到凭证</div>
                        <div class="qr-code">📱</div>
                        <p style="text-align: center; color: var(--color-text-light);">
                            活动当天出示此二维码签到
                        </p>
                    </div>
                ` : `
                    <div class="empty-state" style="padding: 48px; text-align: center;">
                        <div class="empty-icon" style="font-size: 64px;">📋</div>
                        <div class="empty-desc" style="margin-top: 16px; font-size: 18px;">还没有报名活动</div>
                        <button class="btn btn-primary" data-action="go-back" style="margin-top: 24px;">
                            去看看活动
                        </button>
                    </div>
                `}
            </div>
        `;
    },
    
    getProfilePage() {
        return `
            <div class="page active">
                <div class="profile-header">
                    <div class="profile-avatar">${this.userData.avatar}</div>
                    <div class="profile-name">${this.userData.name}</div>
                    <div class="profile-desc">和${this.userData.childName}一起成长</div>
                </div>
                
                <div class="stats-card">
                    <div class="stat-row">
                        <div class="stat-item-large">
                            <div class="stat-value">${this.learningStats.streak}</div>
                            <div class="stat-label">连续学习天数</div>
                        </div>
                        <div class="stat-item-large">
                            <div class="stat-value">${this.learningStats.totalQuestions}</div>
                            <div class="stat-label">累计学习次数</div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-group-title">个人信息</div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">👤</span>
                            <span>我的名字</span>
                        </div>
                        <input type="text" id="user-name-input" style="border: none; text-align: right; font-size: 16px; width: 120px;">
                    </div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">👶</span>
                            <span>孩子名字</span>
                        </div>
                        <input type="text" id="child-name-input" style="border: none; text-align: right; font-size: 16px; width: 120px;">
                    </div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-group-title">语音设置</div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">🔊</span>
                            <span>语音播报</span>
                        </div>
                        <div class="toggle active"></div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">🎤</span>
                            <span>方言识别</span>
                        </div>
                        <div class="toggle active"></div>
                    </div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-group-title">通知设置</div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">🔔</span>
                            <span>任务提醒</span>
                        </div>
                        <div class="toggle active"></div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">💬</span>
                            <span>消息通知</span>
                        </div>
                        <div class="toggle active"></div>
                    </div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-group-title">数据管理</div>
                    <div class="settings-item" data-action="show-history">
                        <div class="settings-label">
                            <span class="settings-icon">📚</span>
                            <span>学习历史</span>
                        </div>
                        <span style="color: var(--color-text-light);">→</span>
                    </div>
                    <div class="settings-item" data-action="clear-history">
                        <div class="settings-label">
                            <span class="settings-icon">🗑️</span>
                            <span>清空历史</span>
                        </div>
                        <span style="color: var(--color-text-light);">→</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getSettingsPage() {
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                    <div class="header-title">设置</div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-group-title">语音设置</div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">🔊</span>
                            <span>语音播报</span>
                        </div>
                        <div class="toggle active"></div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">🎤</span>
                            <span>方言识别</span>
                        </div>
                        <div class="toggle active"></div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">⚡</span>
                            <span>语音速度</span>
                        </div>
                        <select style="border: none; background: var(--color-bg); padding: 8px 12px; border-radius: 8px;">
                            <option>慢速</option>
                            <option selected>正常</option>
                            <option>快速</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-group-title">显示设置</div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">📝</span>
                            <span>字体大小</span>
                        </div>
                        <select style="border: none; background: var(--color-bg); padding: 8px 12px; border-radius: 8px;">
                            <option>小</option>
                            <option selected>中</option>
                            <option>大</option>
                        </select>
                    </div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">🌙</span>
                            <span>深色模式</span>
                        </div>
                        <div class="toggle"></div>
                    </div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-group-title">通知设置</div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">🔔</span>
                            <span>任务提醒</span>
                        </div>
                        <div class="toggle active"></div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">💬</span>
                            <span>消息通知</span>
                        </div>
                        <div class="toggle active"></div>
                    </div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">🎉</span>
                            <span>活动提醒</span>
                        </div>
                        <div class="toggle active"></div>
                    </div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-group-title">关于</div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">📱</span>
                            <span>版本</span>
                        </div>
                        <span style="color: var(--color-text-light);">v1.0.0</span>
                    </div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">📄</span>
                            <span>用户协议</span>
                        </div>
                        <span style="color: var(--color-text-light);">→</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getHistoryPage() {
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                    <div class="header-title">学习历史</div>
                </div>
                
                ${this.history.length > 0 ? `
                    <div class="card">
                        <div class="card-title">📚 问答记录</div>
                        ${this.history.map(item => `
                            <div class="history-item" data-action="show-answer">
                                <div class="history-icon">❓</div>
                                <div class="history-content">
                                    <div class="history-question">${item.question}</div>
                                    <div class="history-time">${item.time}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="card" style="margin-top: 16px;">
                        <div class="card-title">📊 学习统计</div>
                        <div class="stats-row">
                            <div class="stat-item">
                                <div class="stat-value">${this.learningStats.totalQuestions}</div>
                                <div class="stat-label">总问答</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${this.learningStats.streak}</div>
                                <div class="stat-label">连续天数</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${this.tasks.filter(t => t.status === 'completed').length}</div>
                                <div class="stat-label">完成任务</div>
                            </div>
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-lg" data-action="clear-history" style="margin-top: 16px;">
                        清空历史记录
                    </button>
                ` : `
                    <div class="empty-state" style="padding: 48px; text-align: center;">
                        <div class="empty-icon" style="font-size: 64px;">📝</div>
                        <div class="empty-desc" style="margin-top: 16px; font-size: 18px;">还没有学习记录</div>
                        <button class="btn btn-primary" data-action="start-voice" style="margin-top: 24px;">
                            开始学习
                        </button>
                    </div>
                `}
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
