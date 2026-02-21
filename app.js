const App = {
    currentPage: 'home',
    previousPage: null,
    userData: {
        name: '王阿姨',
        childName: '小宝'
    },
    tasks: [
        { id: 1, name: '背古诗《春晓》', status: 'completed', desc: '和小宝一起背诵古诗' },
        { id: 2, name: '数学口算', status: 'in-progress', desc: '完成10道口算题' },
        { id: 3, name: '英语跟读', status: 'pending', desc: '跟读英语单词' }
    ],
    activities: [
        { id: 1, title: '亲子手工活动', date: { day: '22', month: '2月' }, time: '14:00', location: '社区活动中心', participants: 12, expired: false },
        { id: 2, title: '老年人健康讲座', date: { day: '25', month: '2月' }, time: '09:30', location: '社区会议室', participants: 28, expired: false },
        { id: 3, title: '儿童绘画比赛', date: { day: '28', month: '2月' }, time: '10:00', location: '朝阳公园', participants: 45, expired: false }
    ],
    history: [
        { question: '恐龙怎么灭绝的？', time: '今天 10:30' },
        { question: '为什么天是蓝色的？', time: '昨天 15:20' },
        { question: '月亮为什么会变圆变缺？', time: '前天 09:15' }
    ],
    currentQuestion: '',
    currentAnswer: '',
    speechSynthesis: window.speechSynthesis,
    mediaStream: null,
    capturedPhoto: null,
    isRecording: false,
    recognition: null,
    
    init() {
        this.bindEvents();
        this.showPage('home');
        this.updateGreeting();
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
            'profile': this.getProfilePage()
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
            });
        });
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
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.showToast('您的浏览器不支持语音识别，请使用Chrome浏览器');
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
                errorMsg = '请允许麦克风权限\n点击地址栏左侧图标设置';
            } else if (err.name === 'NotFoundError') {
                errorMsg = '未找到麦克风设备';
            }
            if (statusText) statusText.textContent = errorMsg;
            this.showToast(errorMsg);
            return;
        }
        
        this.isRecording = true;
        this.currentQuestion = '';
        
        if (voiceBtn) {
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<span>⏹️</span><span class="voice-btn-text">点击停止</span>';
        }
        if (statusText) statusText.textContent = '正在聆听，请说话...';
        if (recognizedText) recognizedText.textContent = '';
        
        const waveAnimation = document.getElementById('wave-animation');
        if (waveAnimation) waveAnimation.classList.add('active');
        
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.lang = 'zh-CN';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (recognizedText) {
                recognizedText.textContent = finalTranscript || interimTranscript;
            }
            
            if (finalTranscript) {
                this.currentQuestion += finalTranscript;
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            if (event.error !== 'aborted') {
                this.showToast('语音识别出错: ' + event.error);
            }
            this.stopVoiceRecording();
        };
        
        this.recognition.onend = () => {
            if (this.isRecording) {
                try {
                    this.recognition.start();
                } catch (e) {
                    console.log('重启识别失败', e);
                }
            }
        };
        
        try {
            this.recognition.start();
        } catch (err) {
            console.error('启动语音识别失败:', err);
            this.showToast('启动失败，请重试');
            this.isRecording = false;
            if (voiceBtn) {
                voiceBtn.classList.remove('recording');
                voiceBtn.innerHTML = '<span>🎤</span><span class="voice-btn-text">点击说话</span>';
            }
        }
    },
    
    stopVoiceRecording() {
        this.isRecording = false;
        
        const voiceBtn = document.getElementById('voice-btn');
        const statusText = document.getElementById('voice-status');
        const waveAnimation = document.getElementById('wave-animation');
        
        if (waveAnimation) waveAnimation.classList.remove('active');
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                console.log('停止识别失败', e);
            }
        }
        
        if (voiceBtn) {
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<span>🎤</span><span class="voice-btn-text">点击说话</span>';
        }
        
        if (this.currentQuestion && this.currentQuestion.trim()) {
            if (statusText) statusText.textContent = '识别完成！正在生成答案...';
            this.showToast('识别成功！');
            setTimeout(() => {
                this.generateAIAnswer(this.currentQuestion.trim());
            }, 500);
        } else {
            if (statusText) statusText.textContent = '没有识别到内容，请重试';
            this.showToast('没有识别到内容');
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
    
    async generateAIAnswer(question) {
        this.currentQuestion = question;
        
        const answers = this.getAIAnswer(question);
        this.currentAnswer = answers;
        
        this.showPage('answer');
    },
    
    getAIAnswer(question) {
        const q = question.toLowerCase();
        
        const answerDatabase = {
            '恐龙': {
                elder: '很久很久以前，地球上住着很多很多恐龙。后来有一块超级大的石头从天上掉下来，撞到了地球上，天气变得很冷很冷，恐龙们找不到吃的，就慢慢消失了。',
                child: '恐龙是因为一颗很大的陨石撞击地球，导致环境变化而灭绝的哦！科学家们还在研究更多的原因呢。',
                emoji: '🦖'
            },
            '天空': {
                elder: '天空是蓝色的是因为太阳光穿过空气的时候，蓝色的光最容易散开，所以我们看到的天空就是蓝色的。',
                child: '这是因为光的散射现象！太阳光里有七种颜色，蓝色光波长最短，最容易被空气散射，所以天空看起来是蓝色的。',
                emoji: '🌤️'
            },
            '月亮': {
                elder: '月亮本身不会发光，我们看到的月光是太阳照在月亮上的光。月亮绕着地球转，有时候太阳照到的地方多，有时候少，所以我们看到的月亮就会变大变小。',
                child: '这是因为月相变化！月亮绕地球公转，太阳照亮月球的不同部分，所以我们看到月亮有不同的形状。',
                emoji: '🌙'
            },
            '水': {
                elder: '水结冰是因为天气太冷了，水分子挤在一起不动了，就变成了硬硬的冰。等天气暖和了，它们又动起来，就变回水了。',
                child: '这是物质的三态变化！温度降低时，水分子运动减慢，排列成规则的晶体结构，就变成了冰。',
                emoji: '💧'
            },
            '彩虹': {
                elder: '彩虹是下雨后，太阳光穿过小雨滴，就像穿过小玻璃球一样，被分成了七种颜色，就变成了漂亮的彩虹。',
                child: '这是光的折射和反射现象！阳光进入水滴后发生折射，在水滴内部反射，再折射出来，就形成了彩虹。',
                emoji: '🌈'
            },
            '星星': {
                elder: '星星其实很大很大，只是离我们太远了，所以看起来很小。就像飞机在天上飞，看起来也很小一样。',
                child: '星星是遥远的恒星，它们像太阳一样会发光发热。因为距离地球非常远，所以看起来只是小小的光点。',
                emoji: '⭐'
            },
            '睡觉': {
                elder: '睡觉的时候身体在休息，把一天的疲劳都赶走。就像手机要充电一样，人也要睡觉充电。',
                child: '睡眠对身体很重要！大脑在睡眠中整理记忆，身体修复细胞，生长激素也在睡眠时分泌最多。',
                emoji: '😴'
            },
            '吃饭': {
                elder: '吃饭是为了给身体补充能量，就像汽车要加油才能跑一样。不吃饭就没有力气，身体也会生病。',
                child: '食物提供人体需要的营养素：碳水化合物提供能量，蛋白质帮助生长发育，维生素和矿物质维持身体健康。',
                emoji: '🍚'
            }
        };
        
        for (const key in answerDatabase) {
            if (q.includes(key)) {
                return answerDatabase[key];
            }
        }
        
        return {
            elder: '这是一个很好的问题！让我想想怎么给你解释...这个问题很有趣，我们可以一起去书里或者网上找找答案，一起学习新知识！',
            child: '这是一个值得探索的问题！让我们一起去查找资料，学习更多知识吧！科学就是从提问开始的。',
            emoji: '🤔'
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
        
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        
        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            if (result.includes('完成') || result.includes('好了') || result.includes('做完了')) {
                this.showToast('任务确认完成！');
                setTimeout(() => this.showPage('achievement'), 1000);
            } else {
                this.showToast('请说"完成了"来确认');
            }
            voiceConfirmBtn.innerHTML = '<span>🎤</span><span>语音确认</span>';
        };
        
        recognition.onerror = () => {
            this.showToast('语音识别失败，请重试');
            voiceConfirmBtn.innerHTML = '<span>🎤</span><span>语音确认</span>';
        };
        
        try {
            recognition.start();
        } catch (err) {
            this.showToast('启动失败，请重试');
            voiceConfirmBtn.innerHTML = '<span>🎤</span><span>语音确认</span>';
        }
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
                        <button class="btn btn-primary btn-lg" id="camera-btn" style="margin-top: 16px;">
                            📷 拍照
                        </button>
                    </div>
                `;
                
                const video = document.getElementById('camera-video');
                video.srcObject = this.mediaStream;
                
                document.getElementById('camera-btn').addEventListener('click', () => this.capturePhoto());
            }
        } catch (err) {
            console.error('打开相机失败:', err);
            this.showToast('无法打开相机，请检查权限设置');
        }
    },
    
    capturePhoto() {
        const video = document.getElementById('camera-video');
        if (!video) {
            this.showToast('请先打开相机');
            return;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        this.capturedPhoto = canvas.toDataURL('image/jpeg');
        this.stopCamera();
        
        const cameraContainer = document.getElementById('camera-container');
        if (cameraContainer) {
            cameraContainer.innerHTML = `
                <div class="photo-preview">
                    <img src="${this.capturedPhoto}" style="width: 100%; border-radius: 12px;" alt="拍摄的照片">
                    <div style="display: flex; gap: 12px; margin-top: 16px;">
                        <button class="btn btn-outline" onclick="App.openCamera()" style="flex: 1;">
                            🔄 重拍
                        </button>
                        <button class="btn btn-primary" data-action="show-achievement" style="flex: 1;">
                            ✓ 确认
                        </button>
                    </div>
                </div>
            `;
            this.bindPageEvents();
        }
        
        this.showToast('拍照成功！');
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
        utterance.rate = 0.8;
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
                this.showPage('task-detail');
                break;
            case 'complete-task':
                this.showPage('task-complete');
                break;
            case 'show-achievement':
                this.stopCamera();
                this.showPage('achievement');
                break;
            case 'show-activity':
                this.showPage('activity-detail');
                break;
            case 'show-my-activities':
                this.showPage('my-activities');
                break;
            case 'join-activity':
                this.showToast('报名成功！');
                break;
            case 'play-voice':
                this.speakText('妈，今天降温，记得给小宝加衣服');
                break;
            case 'play-answer-voice':
                if (this.currentAnswer && this.currentAnswer.elder) {
                    this.speakText(this.currentAnswer.elder);
                } else {
                    this.speakText('很久很久以前，地球上住着很多很多恐龙。后来有一块超级大的石头从天上掉下来，撞到了地球上，天气变得很冷很冷，恐龙们找不到吃的，就慢慢消失了。');
                }
                break;
            case 'play-animation':
                this.showToast('正在播放动画...');
                break;
            case 'share-result':
                this.showToast('分享功能已触发');
                break;
            case 'take-photo':
                this.openCamera();
                break;
        }
    },
    
    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = '您好';
        if (hour < 12) greeting = '上午好';
        else if (hour < 18) greeting = '下午好';
        else greeting = '晚上好';
        
        const greetingEl = document.querySelector('.greeting-text');
        if (greetingEl) {
            greetingEl.textContent = `${greeting}，${this.userData.name} 🌞`;
        }
    },
    
    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return '上午好';
        else if (hour < 18) return '下午好';
        else return '晚上好';
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
                    <div class="card-title">📋 今日任务（${completedTasks}/${this.tasks.length}）</div>
                    ${this.tasks.map(task => `
                        <div class="task-item" data-action="show-task">
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
                        <div class="progress-fill" style="width: ${completedTasks / this.tasks.length * 100}%"></div>
                    </div>
                    <div class="progress-text">完成进度 ${Math.round(completedTasks / this.tasks.length * 100)}%</div>
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
                        💡 提示：点击按钮开始录音，再次点击停止并发送
                    </div>
                `}
            </div>
        `;
    },
    
    getAnswerPage() {
        const answer = this.currentAnswer || {
            elder: '很久很久以前，地球上住着很多很多恐龙。后来有一块超级大的石头从天上掉下来，撞到了地球上，天气变得很冷很冷，恐龙们找不到吃的，就慢慢消失了。',
            child: '恐龙是因为一颗很大的陨石撞击地球，导致环境变化而灭绝的哦！科学家们还在研究更多的原因呢。',
            emoji: '🦖'
        };
        
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                    <div class="header-title" style="font-size: 18px;">${this.currentQuestion || '问题'}</div>
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
                        <div class="answer-panel-title">👦 给小宝看的</div>
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
                        学会了！教孙子去 👉
                    </button>
                </div>
            </div>
        `;
    },
    
    getSharePage() {
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
                    <div class="share-icon">${this.currentAnswer?.emoji || '🦖'}</div>
                    <div class="share-message">
                        ${this.userData.name}今天学习了<br>
                        <strong>"${this.currentQuestion || '恐龙是怎么灭绝的？'}"</strong><br>
                        和${this.userData.childName}一起成长！
                    </div>
                </div>
                
                <div class="achievement-grid">
                    <div class="achievement-item">
                        <div class="achievement-icon">📚</div>
                        <div class="achievement-count">15</div>
                        <div class="achievement-label">学习次数</div>
                    </div>
                    <div class="achievement-item">
                        <div class="achievement-icon">🔥</div>
                        <div class="achievement-count">7</div>
                        <div class="achievement-label">连续天数</div>
                    </div>
                    <div class="achievement-item">
                        <div class="achievement-icon">⭐</div>
                        <div class="achievement-count">3</div>
                        <div class="achievement-label">获得徽章</div>
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
        
        return `
            <div class="page active">
                <div class="greeting">
                    <div class="greeting-text">${this.getGreeting()}，${this.userData.name}</div>
                    <div class="greeting-date">${this.getDateStr()}</div>
                </div>
                
                <div class="card">
                    <div class="card-title">📋 今日任务（${completedTasks}/${this.tasks.length}）</div>
                    ${this.tasks.map(task => `
                        <div class="task-item" data-action="show-task">
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
                        <div class="progress-fill" style="width: ${completedTasks / this.tasks.length * 100}%"></div>
                    </div>
                    <div class="progress-text">完成进度 ${Math.round(completedTasks / this.tasks.length * 100)}%</div>
                </div>
                
                <div class="card message-card">
                    <div class="card-title">💬 女儿留言</div>
                    <div class="message-content">"妈，今天降温，记得给小宝加衣服"</div>
                    <div class="message-action" data-action="play-voice">
                        <span>🔊</span>
                        <span>播放语音</span>
                    </div>
                </div>
                
                <button class="btn btn-secondary btn-lg" data-action="show-achievement" style="margin-top: 16px;">
                    查看今日成就 🏆
                </button>
            </div>
        `;
    },
    
    getTaskDetailPage() {
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                </div>
                
                <div class="detail-header">
                    <div class="detail-icon">📖</div>
                    <div class="detail-title">数学口算</div>
                    <div class="detail-subtitle">完成10道口算题</div>
                </div>
                
                <div class="card">
                    <div class="card-title">📝 任务要求</div>
                    <div class="detail-content">
                        帮助小宝完成10道口算练习题，包括加法和减法运算。
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">💡 建议做法</div>
                    <div class="step-list">
                        <div class="step-item">
                            <div class="step-number">1</div>
                            <div class="step-content">找一个安静的地方，和小宝一起坐好</div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">2</div>
                            <div class="step-content">打开口算练习本，从第一题开始</div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">3</div>
                            <div class="step-content">让小宝自己算，算对了要表扬</div>
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
                        <div class="photo-upload" id="photo-upload">
                            <div class="photo-upload-icon">📷</div>
                            <div class="photo-upload-text">点击拍照</div>
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
                        <strong>2个任务</strong><br>
                        太棒了！
                    </div>
                </div>
                
                <div class="achievement-grid">
                    <div class="achievement-item">
                        <div class="achievement-icon">📚</div>
                        <div class="achievement-count">2</div>
                        <div class="achievement-label">完成任务</div>
                    </div>
                    <div class="achievement-item">
                        <div class="achievement-icon">⏰</div>
                        <div class="achievement-count">45</div>
                        <div class="achievement-label">学习分钟</div>
                    </div>
                    <div class="achievement-item">
                        <div class="achievement-icon">❓</div>
                        <div class="achievement-count">3</div>
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
                        <div class="participant-count">女儿、小宝已收到通知</div>
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
                
                ${this.activities.map(activity => `
                    <div class="activity-item ${activity.expired ? 'expired' : ''}" data-action="show-activity">
                        <div class="activity-date">
                            <div class="activity-date-day">${activity.date.day}</div>
                            <div class="activity-date-month">${activity.date.month}</div>
                        </div>
                        <div class="activity-info">
                            <div class="activity-title">${activity.title}</div>
                            <div class="activity-meta">
                                <span>🕐 ${activity.time}</span>
                                <span>📍 ${activity.location}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    getActivityDetailPage() {
        return `
            <div class="page active">
                <div class="header">
                    <button class="back-btn" data-action="go-back">
                        <span>←</span>
                        <span>返回</span>
                    </button>
                </div>
                
                <div class="detail-header">
                    <div class="detail-icon">🎨</div>
                    <div class="detail-title">亲子手工活动</div>
                    <div class="detail-subtitle">和孩子一起动手制作</div>
                </div>
                
                <div class="card">
                    <div class="card-title">📅 活动时间</div>
                    <div class="detail-content">
                        2月22日（周六）14:00-16:00
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">📍 活动地点</div>
                    <div class="detail-content">
                        朝阳社区活动中心<br>
                        （社区服务中心3楼）
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">📝 活动内容</div>
                    <div class="detail-content">
                        和孩子一起制作手工灯笼，材料由社区提供，完成的作品可以带回家。
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">👥 已报名</div>
                    <div class="participants">
                        <div class="participant-avatars">
                            <div class="participant-avatar">👩</div>
                            <div class="participant-avatar">👨</div>
                            <div class="participant-avatar">👧</div>
                            <div class="participant-avatar">👦</div>
                        </div>
                        <div class="participant-count">已有12人报名</div>
                    </div>
                </div>
                
                <button class="btn btn-primary btn-lg" data-action="join-activity" style="margin-top: 16px;">
                    立即报名 ✓
                </button>
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
                
                <div class="card">
                    <div class="card-title">✅ 已报名活动</div>
                    <div class="activity-item" data-action="show-activity">
                        <div class="activity-date">
                            <div class="activity-date-day">22</div>
                            <div class="activity-date-month">2月</div>
                        </div>
                        <div class="activity-info">
                            <div class="activity-title">亲子手工活动</div>
                            <div class="activity-meta">
                                <span>🕐 14:00</span>
                                <span class="activity-badge">已报名</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">🎫 签到凭证</div>
                    <div class="qr-code">📱</div>
                    <p style="text-align: center; color: var(--color-text-light);">
                        活动当天出示此二维码签到
                    </p>
                </div>
                
                <div class="card">
                    <div class="card-title">📸 活动照片</div>
                    <div class="empty-state" style="padding: 24px;">
                        <div class="empty-icon">📷</div>
                        <div class="empty-desc">暂无活动照片</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    getProfilePage() {
        return `
            <div class="page active">
                <div class="profile-header">
                    <div class="profile-avatar">👩</div>
                    <div class="profile-name">${this.userData.name}</div>
                    <div class="profile-desc">和小宝一起成长</div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-group-title">显示设置</div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">🔤</span>
                            <span>字体大小</span>
                        </div>
                        <div class="settings-value">大</div>
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
                    <div class="settings-group-title">帮助</div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">❓</span>
                            <span>使用教程</span>
                        </div>
                        <span style="color: var(--color-text-light);">→</span>
                    </div>
                    <div class="settings-item">
                        <div class="settings-label">
                            <span class="settings-icon">📞</span>
                            <span>联系客服</span>
                        </div>
                        <span style="color: var(--color-text-light);">→</span>
                    </div>
                </div>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
