"use strict";
console.clear();

// Theme configuration shared between CSS and game rendering
// Colors are carefully chosen for contrast and visual harmony
const THEME_CONFIGS = {
    "theme-classic": {
        label: "Classic",
        rendererClearColor: 0x000000,
        rendererAlpha: true,
        blockPalette: [0x432331, 0x3d1b6e, 0x611e64, 0xb82737, 0xce8538, 0x388270, 0x277a8c, 0xcabdea],
        textColor: "#ffffff",
        textColorLight: "#dddddd",
        accentColor: "#ffffff",
        accentColorDark: "#cccccc"
    },
};

window.STACKER_THEME_CONFIGS = THEME_CONFIGS;
window.STACKER_CURRENT_THEME_KEY = "theme-classic";
const HIGHSCORE_KEY = "stacker_highscore";
const EASY_MODE_KEY = "stacker_easy_mode";
const FASTER_BLOCKS_KEY = "stacker_faster_blocks";

function getCurrentThemeConfig() {
    const key = window.STACKER_CURRENT_THEME_KEY || "theme-classic";
    return (window.STACKER_THEME_CONFIGS && window.STACKER_THEME_CONFIGS[key]) || THEME_CONFIGS["theme-classic"];
}

class Stage {
    constructor() {
        // container
        this.render = function () {
            this.renderer.render(this.scene, this.camera);
        };
        this.add = function (elem) {
            this.scene.add(elem);
        };
        this.remove = function (elem) {
            this.scene.remove(elem);
        };
        this.container = document.getElementById('game');
        // Force container to fill parent
        if (this.container && this.container.parentElement) {
            const parent = this.container.parentElement;
            parent.style.width = '100%';
            parent.style.height = '100%';
            parent.style.minWidth = '100%';
            parent.style.maxWidth = 'none';
        }
        // renderer
        let themeConfig = getCurrentThemeConfig();
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true // Force alpha true to allow CSS backgrounds
        });
        // Force container and parent to have proper size first
        if (this.container && this.container.parentElement) {
            const parent = this.container.parentElement;
            parent.style.width = '400px';
            parent.style.height = '600px';
            parent.style.minWidth = '400px';
            parent.style.minHeight = '600px';
        }
        // Get dimensions with fallbacks, ensuring we use actual available space
        const getContainerSize = () => {
            // Force minimum size for extension popup
            const minWidth = 400;
            const minHeight = 600;
            
            if (this.container) {
                const rect = this.container.getBoundingClientRect();
                let w = rect.width || this.container.clientWidth || this.container.offsetWidth;
                let h = rect.height || this.container.clientHeight || this.container.offsetHeight;
                
                // Ensure minimum dimensions
                if (w < minWidth) w = minWidth;
                if (h < minHeight) h = minHeight;
                
                if (w > 0 && h > 0) {
                    return { width: w, height: h };
                }
            }
            return { width: Math.max(window.innerWidth || 400, minWidth), height: Math.max(window.innerHeight || 600, minHeight) };
        };
        const containerSize = getContainerSize();
        const containerWidth = containerSize.width;
        const containerHeight = containerSize.height;
        this.renderer.setSize(containerWidth, containerHeight);
        // Let CSS gradient handle background completely
        this.renderer.setClearColor(0x000000, 0); // transparent background
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.margin = '0';
        this.renderer.domElement.style.padding = '0';
        this.renderer.domElement.style.maxWidth = 'none';
        this.renderer.domElement.style.minWidth = '100%';
        this.container.appendChild(this.renderer.domElement);
        // scene
        this.scene = new THREE.Scene();
        // camera
        let aspect = containerWidth / containerHeight || 1;
        let d = 20;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, -100, 1000);
        this.camera.position.x = 2;
        this.camera.position.y = 2;
        this.camera.position.z = 2;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        //light - theme-aware lighting
        this.updateThemeLighting();
        window.addEventListener('resize', () => this.onResize());
        // Force initial resize after a short delay to ensure DOM is ready
        setTimeout(() => this.onResize(), 0);
        requestAnimationFrame(() => this.onResize());
    }
    setCamera(y, speed = 0.3) {
        TweenLite.to(this.camera.position, speed, { y: y + 4, ease: Power1.easeInOut });
        TweenLite.to(this.camera.lookAt, speed, { y: y, ease: Power1.easeInOut });
    }
    updateThemeLighting() {
        // Remove existing lights
        if (this.light) this.scene.remove(this.light);
        if (this.softLight) this.scene.remove(this.softLight);
        if (this.themeLight) this.scene.remove(this.themeLight);
        
        // Classic theme lighting
        this.light = new THREE.DirectionalLight(0xffffff, 0.6);
        this.softLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.themeLight = null;
        
        this.light.position.set(5, 10, 7);
        this.scene.add(this.light);
        this.scene.add(this.softLight);
    }
    onResize() {
        let viewSize = 30;
        const minWidth = 400;
        const minHeight = 600;
        
        // Get container dimensions more reliably
        let containerWidth, containerHeight;
        if (this.container) {
            const rect = this.container.getBoundingClientRect();
            containerWidth = rect.width || this.container.clientWidth || this.container.offsetWidth || window.innerWidth;
            containerHeight = rect.height || this.container.clientHeight || this.container.offsetHeight || window.innerHeight;
            
            // Force minimum dimensions
            if (containerWidth < minWidth) {
                containerWidth = minWidth;
                if (this.container.parentElement) {
                    this.container.parentElement.style.width = minWidth + 'px';
                    this.container.parentElement.style.minWidth = minWidth + 'px';
                }
                this.container.style.width = minWidth + 'px';
                this.container.style.minWidth = minWidth + 'px';
            }
            if (containerHeight < minHeight) {
                containerHeight = minHeight;
                if (this.container.parentElement) {
                    this.container.parentElement.style.height = minHeight + 'px';
                    this.container.parentElement.style.minHeight = minHeight + 'px';
                }
                this.container.style.height = minHeight + 'px';
                this.container.style.minHeight = minHeight + 'px';
            }
        } else {
            containerWidth = Math.max(window.innerWidth || 400, minWidth);
            containerHeight = Math.max(window.innerHeight || 600, minHeight);
        }
        // Ensure minimum dimensions
        if (containerWidth <= 0) containerWidth = Math.max(window.innerWidth || 400, minWidth);
        if (containerHeight <= 0) containerHeight = Math.max(window.innerHeight || 600, minHeight);
        
        this.renderer.setSize(containerWidth, containerHeight);
        const aspect = containerWidth / containerHeight || 1;
        this.camera.left = containerWidth / -viewSize;
        this.camera.right = containerWidth / viewSize;
        this.camera.top = containerHeight / viewSize;
        this.camera.bottom = containerHeight / -viewSize;
        this.camera.updateProjectionMatrix();
    }
}
class Block {
    constructor(block) {
        // set size and position
        this.STATES = { ACTIVE: 'active', STOPPED: 'stopped', MISSED: 'missed' };
        // Check easy mode and faster blocks
        this.easyMode = this.isEasyModeEnabled();
        this.fasterBlocks = this.isFasterBlocksEnabled();
        this.MOVE_AMOUNT = this.easyMode ? 6 : 12; // Reduced movement range in easy mode
        this.dimension = { width: 0, height: 0, depth: 0 };
        this.position = { x: 0, y: 0, z: 0 };
        this.targetBlock = block;
        this.index = (this.targetBlock ? this.targetBlock.index : 0) + 1;
        this.workingPlane = this.index % 2 ? 'x' : 'z';
        this.workingDimension = this.index % 2 ? 'width' : 'depth';
        // set the dimensions from the target block, or defaults.
        this.dimension.width = this.targetBlock ? this.targetBlock.dimension.width : 10;
        this.dimension.height = this.targetBlock ? this.targetBlock.dimension.height : 2;
        this.dimension.depth = this.targetBlock ? this.targetBlock.dimension.depth : 10;
        this.position.x = this.targetBlock ? this.targetBlock.position.x : 0;
        this.position.y = this.dimension.height * this.index;
        this.position.z = this.targetBlock ? this.targetBlock.position.z : 0;
        this.colorOffset = this.targetBlock ? this.targetBlock.colorOffset : Math.round(Math.random() * 100);
        // Generate distinct, high-contrast colors for better visibility
        // Use HSL color space to create vibrant, distinct colors
        const hueStep = 360 / 12; // 12 distinct hues for variety
        const hue = ((this.index - 1) * hueStep + this.colorOffset) % 360;
        const saturation = 0.65 + (this.index % 3) * 0.1; // Vary saturation between 0.65-0.85
        const lightness = 0.5 + (this.index % 4) * 0.08; // Vary lightness between 0.5-0.74
        
        // Convert HSL to RGB
        const h = hue / 360;
        const s = saturation;
        const l = lightness;
        
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        this.color = new THREE.Color(r, g, b);
        // state
        this.state = this.index > 1 ? this.STATES.ACTIVE : this.STATES.STOPPED;
        // set direction - much slower in easy mode, 50% faster if faster blocks enabled
        if (this.easyMode) {
            this.speed = -0.03 - (this.index * 0.001); // Much slower speed
            if (this.speed < -1.5)
                this.speed = -1.5; // Cap at slower max speed
        } else {
            this.speed = -0.1 - (this.index * 0.005);
            if (this.speed < -4)
                this.speed = -4;
        }
        // Apply 50% speed increase if faster blocks is enabled
        if (this.fasterBlocks) {
            this.speed = this.speed * 1.50; // 50% faster (more negative = faster)
            // Update max speed cap if needed
            if (this.easyMode && this.speed < -1.5 * 1.50) {
                this.speed = -1.5 * 1.50; // Cap at 50% faster max speed for easy mode
            } else if (!this.easyMode && this.speed < -4 * 1.50) {
                this.speed = -4 * 1.50; // Cap at 50% faster max speed for normal mode
            }
        }
        this.direction = this.speed;
        // create block with enhanced materials
        let geometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
        
        // Enhanced material - using Lambert for soft, clean shading
        let materialProps = { 
            color: this.color, 
            transparent: true,
            opacity: 0.95,
        };
        
        this.material = new THREE.MeshLambertMaterial(materialProps);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(this.position.x, this.position.y + (this.state == this.STATES.ACTIVE ? 0 : 0), this.position.z);
        if (this.state == this.STATES.ACTIVE) {
            if (this.easyMode) {
                // In easy mode, start closer to center for easier alignment
                const offset = this.MOVE_AMOUNT * 0.3; // Start at 30% of range instead of 100%
                this.position[this.workingPlane] = Math.random() > 0.5 ? -offset : offset;
            } else {
                this.position[this.workingPlane] = Math.random() > 0.5 ? -this.MOVE_AMOUNT : this.MOVE_AMOUNT;
            }
        }
    }
    isEasyModeEnabled() {
        try {
            const stored = window.localStorage.getItem(EASY_MODE_KEY);
            return stored === 'true';
        } catch (e) {
            return false;
        }
    }
    isFasterBlocksEnabled() {
        try {
            const stored = window.localStorage.getItem(FASTER_BLOCKS_KEY);
            return stored === 'true';
        } catch (e) {
            return false;
        }
    }
    reverseDirection() {
        this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed);
    }
    place() {
        this.state = this.STATES.STOPPED;
        let overlap = this.targetBlock.dimension[this.workingDimension] - Math.abs(this.position[this.workingPlane] - this.targetBlock.position[this.workingPlane]);
        let blocksToReturn = {
            plane: this.workingPlane,
            direction: this.direction
        };
        // Calculate original dimension before any adjustments
        const originalDimension = this.dimension[this.workingDimension];
        
        // In easy mode, use a much larger threshold for perfect placement (0.9 instead of 0.3)
        // This makes it way easier to get perfect placements and harder to lose
        const perfectThreshold = this.easyMode ? 0.9 : 0.3;
        if (this.dimension[this.workingDimension] - overlap < perfectThreshold) {
            overlap = this.dimension[this.workingDimension];
            blocksToReturn.bonus = true;
            blocksToReturn.choppedPercent = 0; // Perfect placement
            this.position.x = this.targetBlock.position.x;
            this.position.z = this.targetBlock.position.z;
            this.dimension.width = this.targetBlock.dimension.width;
            this.dimension.depth = this.targetBlock.dimension.depth;
        } else {
            // Calculate percentage chopped off
            const choppedAmount = originalDimension - overlap;
            blocksToReturn.choppedPercent = Math.round((choppedAmount / originalDimension) * 100);
        }
        // In easy mode, also give a larger margin for error - if overlap is close, auto-center
        if (this.easyMode && overlap > 0 && overlap < this.dimension[this.workingDimension] * 0.5) {
            // Auto-center the block if it's close enough
            const centerOffset = (this.position[this.workingPlane] - this.targetBlock.position[this.workingPlane]) * 0.3;
            this.position[this.workingPlane] -= centerOffset;
            overlap = this.targetBlock.dimension[this.workingDimension] - Math.abs(this.position[this.workingPlane] - this.targetBlock.position[this.workingPlane]);
        }
        if (overlap > 0) {
            let choppedDimensions = { width: this.dimension.width, height: this.dimension.height, depth: this.dimension.depth };
            choppedDimensions[this.workingDimension] -= overlap;
            this.dimension[this.workingDimension] = overlap;
            let placedGeometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
            placedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
            let placedMesh = new THREE.Mesh(placedGeometry, this.material);
            let choppedGeometry = new THREE.BoxGeometry(choppedDimensions.width, choppedDimensions.height, choppedDimensions.depth);
            choppedGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(choppedDimensions.width / 2, choppedDimensions.height / 2, choppedDimensions.depth / 2));
            let choppedMesh = new THREE.Mesh(choppedGeometry, this.material);
            let choppedPosition = {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            };
            if (this.position[this.workingPlane] < this.targetBlock.position[this.workingPlane]) {
                this.position[this.workingPlane] = this.targetBlock.position[this.workingPlane];
            }
            else {
                choppedPosition[this.workingPlane] += overlap;
            }
            placedMesh.position.set(this.position.x, this.position.y, this.position.z);
            choppedMesh.position.set(choppedPosition.x, choppedPosition.y, choppedPosition.z);
            blocksToReturn.placed = placedMesh;
            if (!blocksToReturn.bonus)
                blocksToReturn.chopped = choppedMesh;
        }
        else {
            this.state = this.STATES.MISSED;
        }
        this.dimension[this.workingDimension] = overlap;
        return blocksToReturn;
    }
    tick() {
        if (this.state == this.STATES.ACTIVE) {
            let value = this.position[this.workingPlane];
            if (value > this.MOVE_AMOUNT || value < -this.MOVE_AMOUNT)
                this.reverseDirection();
            this.position[this.workingPlane] += this.direction;
            this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
        }
    }
}
class Game {
    constructor() {
        this.STATES = {
            'LOADING': 'loading',
            'PLAYING': 'playing',
            'READY': 'ready',
            'ENDED': 'ended',
            'RESETTING': 'resetting'
        };
        this.blocks = [];
        this.state = this.STATES.LOADING;
        this.stage = new Stage();
        this.mainContainer = document.getElementById('container');
        this.scoreContainer = document.getElementById('score');
        this.highscoreValue = document.getElementById('highscore-value');
        this.startButton = document.getElementById('start-button');
        this.instructions = document.getElementById('instructions');
        this.placementFeedback = document.getElementById('placement-feedback');
        this.scoreContainer.innerHTML = '0';
        this.bestScore = 0;
        this.loadBestScore();
        this.updateHighscoreUI(false);
        this.newBlocks = new THREE.Group();
        this.placedBlocks = new THREE.Group();
        this.choppedBlocks = new THREE.Group();
        this.gridGroup = new THREE.Group(); // Group for the target grid outline

        this.stage.add(this.newBlocks);
        this.stage.add(this.placedBlocks);
        this.stage.add(this.choppedBlocks);
        this.stage.add(this.gridGroup);

        this.addBlock();
        this.tick();
        this.updateState(this.STATES.READY);
        document.addEventListener('keydown', e => {
            if (e.keyCode == 32)
                this.onAction();
        });
        document.addEventListener('click', e => {
            const target = e.target;
            if (target && target.closest && target.closest('.dropdown')) {
                return;
            }
            this.onAction();
        });
        document.addEventListener('touchstart', e => {
            e.preventDefault();
            // this.onAction();
            // ☝️ this triggers after click on android so you
            // insta-lose, will figure it out later.
        });
    }
    updateState(newState) {
        for (let key in this.STATES)
            this.mainContainer.classList.remove(this.STATES[key]);
        this.mainContainer.classList.add(newState);
        this.state = newState;
    }
    loadBestScore() {
        try {
            const stored = window.localStorage.getItem(HIGHSCORE_KEY);
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed) && parsed > 0) {
                this.bestScore = parsed;
            }
        }
        catch (e) {
            this.bestScore = this.bestScore || 0;
        }
    }
    saveBestScore() {
        try {
            window.localStorage.setItem(HIGHSCORE_KEY, String(this.bestScore || 0));
        }
        catch (e) {
            // ignore storage errors
        }
    }
    updateHighscoreUI(isNew) {
        if (this.highscoreValue) {
            this.highscoreValue.textContent = String(this.bestScore || 0);
        }
        this.mainContainer.classList.toggle('highscore-new', !!isNew);
    }
    onAction() {
        switch (this.state) {
            case this.STATES.READY:
                this.startGame();
                break;
            case this.STATES.PLAYING:
                this.placeBlock();
                break;
            case this.STATES.ENDED:
                this.restartGame();
                break;
        }
    }
    startGame() {
        if (this.state != this.STATES.PLAYING) {
            // Hide STACKY title after first click (per session)
            const bgTitle = document.getElementById('bg-title');
            if (bgTitle && !bgTitle.classList.contains('hidden')) {
                bgTitle.classList.add('hidden');
            }
            
            // Animate game blocks back up smoothly
            const gameElement = document.getElementById('game');
            if (gameElement) {
                TweenLite.to(gameElement, 0.4, {
                    transform: 'translateY(0px)',
                    ease: Power2.easeOut
                });
            }
            
            this.scoreContainer.innerHTML = '0';
            // Reset score animation and opacity
            if (this.scoreContainer) {
                TweenLite.set(this.scoreContainer, { scale: 1, y: 0, opacity: 1 });
            }
            this.updateState(this.STATES.PLAYING);
            // Hide instructions after game starts
            if (this.instructions) {
                this.instructions.classList.add('hide');
            }
            this.addBlock();
        }
    }
    restartGame() {
        this.updateState(this.STATES.RESETTING);
        
        // Ensure instructions are visible again after game over
        if (this.instructions) {
            TweenLite.set(this.instructions, { opacity: 1 });
        }
        
        let oldBlocks = this.placedBlocks.children;
        let removeSpeed = 0.25;
        let delayAmount = 0.02;
        
        // Enhanced block removal animation
        for (let i = 0; i < oldBlocks.length; i++) {
            const delay = (oldBlocks.length - i) * delayAmount;
            TweenLite.to(oldBlocks[i].scale, removeSpeed, { 
                x: 0, 
                y: 0, 
                z: 0, 
                delay: delay, 
                ease: Power2.easeIn, 
                onComplete: () => this.placedBlocks.remove(oldBlocks[i]) 
            });
            TweenLite.to(oldBlocks[i].rotation, removeSpeed, { 
                x: Math.random() * 0.5,
                y: 0.5 + Math.random() * 0.3, 
                z: Math.random() * 0.5,
                delay: delay, 
                ease: Power2.easeIn 
            });
            // Fade out
            TweenLite.to(oldBlocks[i].material, removeSpeed * 0.8, {
                opacity: 0,
                delay: delay,
                ease: Power1.easeIn
            });
        }
        
        let cameraMoveSpeed = removeSpeed * 2 + (oldBlocks.length * delayAmount);
        this.stage.setCamera(2, cameraMoveSpeed);
        
        // Animated countdown with easing
        let countdown = { value: this.blocks.length - 1 };
        TweenLite.to(countdown, cameraMoveSpeed, { 
            value: 0, 
            ease: Power1.easeIn,
            onUpdate: () => { 
                const rounded = Math.round(countdown.value);
                this.scoreContainer.innerHTML = String(rounded);
                // Pulse effect on countdown
                if (rounded !== Math.round(countdown.value + 0.1)) {
                    TweenLite.to(this.scoreContainer, 0.15, {
                        scale: 1.1,
                        ease: Power2.easeOut,
                        onComplete: () => {
                            TweenLite.to(this.scoreContainer, 0.2, {
                                scale: 1,
                                ease: Power2.easeIn
                            });
                        }
                    });
                }
            } 
        });
        
        // Clear grid
        while(this.gridGroup.children.length > 0){ 
            this.gridGroup.remove(this.gridGroup.children[0]); 
        }
        this.blocks = this.blocks.slice(0, 1);
        setTimeout(() => {
            this.startGame();
        }, cameraMoveSpeed * 1000);
    }
    placeBlock() {
        let currentBlock = this.blocks[this.blocks.length - 1];
        let newBlocks = currentBlock.place();
        this.newBlocks.remove(currentBlock.mesh);
        if (newBlocks.placed) {
            this.placedBlocks.add(newBlocks.placed);
            
            // Show placement feedback
            this.showPlacementFeedback(newBlocks.bonus, newBlocks.choppedPercent);
            
            // Perfect placement feedback
            if (newBlocks.bonus) {
                this.createPerfectPlacementEffect(newBlocks.placed);
            }
            
            // Subtle bounce animation on placement
            const originalY = newBlocks.placed.position.y;
            TweenLite.to(newBlocks.placed.position, 0.15, {
                y: originalY + 0.5,
                ease: Power2.easeOut,
                onComplete: () => {
                    TweenLite.to(newBlocks.placed.position, 0.2, {
                        y: originalY,
                        ease: Power2.easeIn
                    });
                }
            });
        }
        if (newBlocks.chopped) {
            this.choppedBlocks.add(newBlocks.chopped);
            let positionParams = { y: '-=30', ease: Power1.easeIn, onComplete: () => this.choppedBlocks.remove(newBlocks.chopped) };
            let rotateRandomness = 10;
            let rotationParams = {
                delay: 0.05,
                x: newBlocks.plane == 'z' ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
                z: newBlocks.plane == 'x' ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
                y: Math.random() * 0.1,
            };
            if (newBlocks.chopped.position[newBlocks.plane] > newBlocks.placed.position[newBlocks.plane]) {
                positionParams[newBlocks.plane] = '+=' + (40 * Math.abs(newBlocks.direction));
            }
            else {
                positionParams[newBlocks.plane] = '-=' + (40 * Math.abs(newBlocks.direction));
            }
            TweenLite.to(newBlocks.chopped.position, 1, positionParams);
            TweenLite.to(newBlocks.chopped.rotation, 1, rotationParams);
        }
        this.addBlock();
    }
    
    createPerfectPlacementEffect(block) {
        // Create a visual effect for perfect placement
        const themeConfig = getCurrentThemeConfig();
        const color = block.material.color;
        
        // Add a subtle glow effect
        TweenLite.to(block.material, 0.3, {
            opacity: 0.9,
            ease: Power2.easeOut,
            onComplete: () => {
                TweenLite.to(block.material, 0.3, {
                    opacity: 1,
                    ease: Power2.easeIn
                });
            }
        });
        
        // Scale pulse
        const originalScale = { x: 1, y: 1, z: 1 };
        TweenLite.to(block.scale, 0.2, {
            x: 1.05,
            y: 1.05,
            z: 1.05,
            ease: Power2.easeOut,
            onComplete: () => {
                TweenLite.to(block.scale, 0.3, {
                    x: 1,
                    y: 1,
                    z: 1,
                    ease: Power2.easeIn
                });
            }
        });
    }
    
    showPlacementFeedback(isPerfect, choppedPercent) {
        if (!this.placementFeedback) return;
        
        let feedbackText = '';
        if (isPerfect) {
            feedbackText = 'PERFECT!';
            this.placementFeedback.classList.add('perfect');
        } else if (choppedPercent !== undefined) {
            feedbackText = `-${choppedPercent}%`;
            this.placementFeedback.classList.remove('perfect');
        }
        
        if (!feedbackText) return;
        
        // Set text and show
        this.placementFeedback.textContent = feedbackText;
        this.placementFeedback.style.display = 'block';
        
        // Force layout calculation to get accurate width
        this.placementFeedback.offsetHeight;
        
        // Calculate the offset needed to center the element
        // Element is at left: 50%, so we need to move it left by half its width
        const rect = this.placementFeedback.getBoundingClientRect();
        const elementWidth = rect.width || this.placementFeedback.offsetWidth;
        const centerOffset = elementWidth > 0 ? -(elementWidth / 2) : 0;
        
        // Reset and animate - use x to center horizontally
        TweenLite.set(this.placementFeedback, {
            opacity: 0,
            y: 0,
            x: centerOffset,
            scale: 0.8,
            transformOrigin: "center center"
        });
        
        // Animate in - maintain horizontal centering
        TweenLite.to(this.placementFeedback, 0.3, {
            opacity: 0.85,
            y: -20,
            x: centerOffset,
            scale: 1,
            ease: Power2.easeOut
        });
        
        // Animate out - maintain horizontal centering
        TweenLite.to(this.placementFeedback, 0.3, {
            opacity: 0,
            y: -40,
            x: centerOffset,
            scale: 0.9,
            delay: 0.8,
            ease: Power2.easeIn,
            onComplete: () => {
                this.placementFeedback.style.display = 'none';
            }
        });
    }
    addBlock() {
        let lastBlock = this.blocks[this.blocks.length - 1];
        if (lastBlock && lastBlock.state == lastBlock.STATES.MISSED) {
            return this.endGame();
        }
        const newScore = this.blocks.length - 1;
        this.animateScoreUpdate(newScore);
        let newKidOnTheBlock = new Block(lastBlock);
        this.newBlocks.add(newKidOnTheBlock.mesh);
        this.blocks.push(newKidOnTheBlock);
        this.stage.setCamera(this.blocks.length * 2);

        // Update grid outline
        if (lastBlock && lastBlock.state !== lastBlock.STATES.MISSED) {
            this.updateTargetGrid(lastBlock);
        } else {
            // clear grid if not playing
            while(this.gridGroup.children.length > 0){ 
                this.gridGroup.remove(this.gridGroup.children[0]); 
            }
        }
    }
    isEasyModeEnabled() {
        try {
            const stored = window.localStorage.getItem(EASY_MODE_KEY);
            return stored === 'true';
        } catch (e) {
            return false;
        }
    }
    toggleEasyMode() {
        const currentState = this.isEasyModeEnabled();
        const newState = !currentState;
        try {
            window.localStorage.setItem(EASY_MODE_KEY, String(newState));
        } catch (e) {
            // ignore storage errors
        }
        return newState;
    }
    toggleFasterBlocks() {
        const currentState = this.isFasterBlocksEnabled();
        const newState = !currentState;
        try {
            window.localStorage.setItem(FASTER_BLOCKS_KEY, String(newState));
        } catch (e) {
            // ignore storage errors
        }
        return newState;
    }
    isFasterBlocksEnabled() {
        try {
            const stored = window.localStorage.getItem(FASTER_BLOCKS_KEY);
            return stored === 'true';
        } catch (e) {
            return false;
        }
    }
    
    animateScoreUpdate(newScore) {
        const scoreEl = this.scoreContainer;
        if (!scoreEl) return;
        
        // Pulse animation on score update
        TweenLite.to(scoreEl, 0.2, {
            scale: 1.15,
            ease: Power2.easeOut,
            onComplete: () => {
                scoreEl.innerHTML = String(newScore);
                TweenLite.to(scoreEl, 0.3, {
                    scale: 1,
                    ease: Power2.easeIn
                });
            }
        });
    }

    updateTargetGrid(targetBlock) {
        // Clear old grid
        while(this.gridGroup.children.length > 0){ 
            this.gridGroup.remove(this.gridGroup.children[0]); 
        }

        if(!targetBlock || !targetBlock.mesh) return;

        // Create edges geometry
        let geometry = new THREE.BoxGeometry(targetBlock.dimension.width, targetBlock.dimension.height, targetBlock.dimension.depth);
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(targetBlock.dimension.width / 2, targetBlock.dimension.height / 2, targetBlock.dimension.depth / 2));
        
        // We only want to show grid on the top face if possible, or simple whole wireframe if that's easier.
        // The screenshot shows a grid pattern. Instead of full edges, we can create a grid helper for the top.
        const sizeX = targetBlock.dimension.width;
        const sizeZ = targetBlock.dimension.depth;
        const maxDim = Math.max(sizeX, sizeZ);
        
        // Create custom grid for the top face
        // Just lines spanning the x and z to form a grid on the top face
        const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, linewidth: 2 });
        const gridGeom = new THREE.Geometry();
        
        const divisions = 2; // lines per unit or so
        const xStep = sizeX / divisions;
        const zStep = sizeZ / divisions;

        // Draw lines along X
        for (let idx = 0; idx <= divisions; idx++) {
            let z = idx * zStep;
            gridGeom.vertices.push(
                new THREE.Vector3(0, targetBlock.dimension.height, z),
                new THREE.Vector3(sizeX, targetBlock.dimension.height, z)
            );
        }
        // Draw lines along Z
        for (let idx = 0; idx <= divisions; idx++) {
            let x = idx * xStep;
            gridGeom.vertices.push(
                new THREE.Vector3(x, targetBlock.dimension.height, 0),
                new THREE.Vector3(x, targetBlock.dimension.height, sizeZ)
            );
        }

        const lines = new THREE.LineSegments(gridGeom, material);
        // Position exactly on top of block
        lines.position.set(targetBlock.position.x, targetBlock.position.y, targetBlock.position.z);
        // Slightly raise the grid to avoid z-fighting
        lines.position.y += 0.05;

        // Animate the grid dropping in or fading in
        lines.material.opacity = 0;
        TweenLite.to(lines.material, 0.3, { opacity: 0.8 });

        this.gridGroup.add(lines);
    }

    endGame() {
        const currentScore = parseInt(this.scoreContainer.innerHTML, 10) || 0;
        let isNew = false;
        if (currentScore > (this.bestScore || 0)) {
            this.bestScore = currentScore;
            this.saveBestScore();
            isNew = true;
        }
        this.updateHighscoreUI(isNew);
        
        // Add game over animations and effects
        this.animateGameOver(currentScore, isNew);
        
        this.updateState(this.STATES.ENDED);
    }
    
    animateGameOver(score, isNewHighscore) {
        // Hide score and instructions immediately
        const scoreEl = this.scoreContainer;
        const instructionsEl = this.instructions;
        if (scoreEl) {
            TweenLite.to(scoreEl, 0.3, {
                opacity: 0,
                ease: Power2.easeOut
            });
        }
        if (instructionsEl) {
            TweenLite.to(instructionsEl, 0.3, {
                opacity: 0,
                ease: Power2.easeOut
            });
        }
        
        // Shake effect for missed block
        if (this.blocks.length > 0) {
            const lastBlock = this.blocks[this.blocks.length - 1];
            if (lastBlock && lastBlock.mesh) {
                const shakeAmount = 0.3;
                TweenLite.to(lastBlock.mesh.position, 0.1, {
                    x: lastBlock.mesh.position.x + (Math.random() - 0.5) * shakeAmount,
                    z: lastBlock.mesh.position.z + (Math.random() - 0.5) * shakeAmount,
                    yoyo: true,
                    repeat: 5,
                    ease: Power1.easeInOut
                });
            }
        }
        
        // Update game over card with score
        const gameOverCard = document.querySelector('.game-over-card');
        if (gameOverCard) {
            const scoreDisplay = gameOverCard.querySelector('.final-score');
            if (scoreDisplay) {
                // Animate score counting up
                const targetScore = score;
                const duration = 0.8;
                const startTime = Date.now();
                const animateScore = () => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const progress = Math.min(elapsed / duration, 1);
                    const currentScore = Math.floor(progress * targetScore);
                    scoreDisplay.textContent = currentScore;
                    if (progress < 1) {
                        requestAnimationFrame(animateScore);
                    } else {
                        scoreDisplay.textContent = targetScore;
                    }
                };
                animateScore();
            }
            
            // Show highscore badge if new record
            const highscoreBadge = gameOverCard.querySelector('.highscore-badge');
            if (highscoreBadge) {
                if (isNewHighscore) {
                    highscoreBadge.style.display = 'flex';
                    gameOverCard.classList.add('new-highscore');
                    this.createCelebrationParticles();
                } else {
                    highscoreBadge.style.display = 'none';
                }
            }
        }
    }
    
    createCelebrationParticles() {
        // Create visual particle effect for new highscore
        const container = this.mainContainer;
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            particle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: linear-gradient(135deg, #ffd700, #ff6b9d);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: 50%;
                top: 50%;
                opacity: 0;
            `;
            container.appendChild(particle);
            
            const angle = (Math.PI * 2 * i) / 20;
            const distance = 100 + Math.random() * 50;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            TweenLite.to(particle, 1.2, {
                x: x,
                y: y,
                opacity: 1,
                scale: 1.5,
                ease: Power2.easeOut,
                delay: Math.random() * 0.2
            });
            
            TweenLite.to(particle, 0.8, {
                opacity: 0,
                scale: 0,
                ease: Power2.easeIn,
                delay: 0.4 + Math.random() * 0.2,
                onComplete: () => particle.remove()
            });
        }
    }
    updateCurrentBlockSpeed() {
        // Update the speed of the currently active block
        if (this.blocks && this.blocks.length > 0) {
            const currentBlock = this.blocks[this.blocks.length - 1];
            if (currentBlock && currentBlock.state === currentBlock.STATES.ACTIVE) {
                // Recalculate speed based on current settings
                const easyMode = currentBlock.isEasyModeEnabled();
                const fasterBlocks = currentBlock.isFasterBlocksEnabled();
                
                let baseSpeed;
                if (easyMode) {
                    baseSpeed = -0.03 - (currentBlock.index * 0.001);
                    if (baseSpeed < -1.5)
                        baseSpeed = -1.5;
                } else {
                    baseSpeed = -0.1 - (currentBlock.index * 0.005);
                    if (baseSpeed < -4)
                        baseSpeed = -4;
                }
                
                // Apply faster blocks multiplier
                if (fasterBlocks) {
                    baseSpeed = baseSpeed * 1.50;
                    if (easyMode && baseSpeed < -1.5 * 1.50) {
                        baseSpeed = -1.5 * 1.50;
                    } else if (!easyMode && baseSpeed < -4 * 1.50) {
                        baseSpeed = -4 * 1.50;
                    }
                }
                
                // Update the block's speed and direction
                // Preserve the direction sign (positive or negative) when updating speed
                // Direction alternates: positive uses abs(speed), negative uses speed
                currentBlock.speed = baseSpeed;
                if (currentBlock.direction > 0) {
                    currentBlock.direction = Math.abs(baseSpeed); // Positive direction
                } else {
                    currentBlock.direction = baseSpeed; // Negative direction (speed is already negative)
                }
            }
        }
    }
    tick() {
        this.blocks[this.blocks.length - 1].tick();
        this.stage.render();
        requestAnimationFrame(() => { this.tick(); });
    }
}
let game = new Game();
window.game = game; // Make accessible globally

// Force proper sizing for extension popup
(function() {
    const forceSize = () => {
        const html = document.documentElement;
        const body = document.body;
        const container = document.getElementById('container');
        const game = document.getElementById('game');
        
        // Set explicit minimum sizes
        const minWidth = 400;
        const minHeight = 600;
        
        if (html) {
            html.style.width = '100%';
            html.style.height = '100%';
            html.style.minWidth = minWidth + 'px';
            html.style.minHeight = minHeight + 'px';
            html.style.maxWidth = 'none';
            html.style.margin = '0';
            html.style.padding = '0';
        }
        
        if (body) {
            body.style.width = '100%';
            body.style.height = '100%';
            body.style.minWidth = minWidth + 'px';
            body.style.minHeight = minHeight + 'px';
            body.style.maxWidth = 'none';
            body.style.margin = '0';
            body.style.padding = '0';
        }
        
        if (container) {
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.minWidth = minWidth + 'px';
            container.style.minHeight = minHeight + 'px';
            container.style.maxWidth = 'none';
        }
        
        if (game) {
            game.style.width = '100%';
            game.style.height = '100%';
            game.style.minWidth = minWidth + 'px';
            game.style.minHeight = minHeight + 'px';
            game.style.maxWidth = 'none';
        }
        
        // Force resize on game stage
        if (window.game && window.game.stage) {
            window.game.stage.onResize();
        }
    };
    
    // Run immediately and on various events
    forceSize();
    window.addEventListener('load', forceSize);
    window.addEventListener('resize', forceSize);
    setTimeout(forceSize, 0);
    setTimeout(forceSize, 50);
    setTimeout(forceSize, 100);
    setTimeout(forceSize, 200);
    requestAnimationFrame(forceSize);
    requestAnimationFrame(() => {
        requestAnimationFrame(forceSize);
    });
})();

// Ensure classic theme is applied
(function () {
    const body = document.body;
    // Remove any other theme classes and ensure classic is set
    body.classList.remove("theme-ocean", "theme-sunset", "theme-forest");
    if (!body.classList.contains("theme-classic")) {
        body.classList.add("theme-classic");
    }
    window.STACKER_CURRENT_THEME_KEY = "theme-classic";
    
    // Set renderer clear color for classic theme
    const cfg = getCurrentThemeConfig();
    if (game && game.stage && game.stage.renderer) {
        if (cfg.rendererAlpha === true) {
            game.stage.renderer.setClearColor(0x000000, 0);
        } else {
            game.stage.renderer.setClearColor(cfg.rendererClearColor, 1);
        }
    }
})();

// Easy mode toggle
(function () {
    const easyModeToggle = document.querySelector('.easy-mode-toggle');
    if (!easyModeToggle)
        return;
    
    const updateEasyModeButton = () => {
        try {
            const isEnabled = window.localStorage.getItem(EASY_MODE_KEY) === 'true';
            easyModeToggle.textContent = isEnabled ? 'Easy mode: ON' : 'Toggle easy mode';
            if (isEnabled) {
                easyModeToggle.style.fontWeight = '600';
                easyModeToggle.style.color = '#4CAF50';
            } else {
                easyModeToggle.style.fontWeight = '500';
                easyModeToggle.style.color = '';
            }
        } catch (e) {
            easyModeToggle.textContent = 'Toggle easy mode';
        }
    };
    
    // Initialize button state
    updateEasyModeButton();
    
    easyModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const gameInstance = window.game || game;
        if (gameInstance && gameInstance.toggleEasyMode) {
            const newState = gameInstance.toggleEasyMode();
            updateEasyModeButton();
            
            // Animate button
            TweenLite.to(easyModeToggle, 0.2, {
                scale: 0.95,
                ease: Power2.easeOut,
                onComplete: () => {
                    TweenLite.to(easyModeToggle, 0.3, {
                        scale: 1,
                        ease: Power2.easeOut
                    });
                }
            });
            
            // Show notification
            const notification = document.createElement('div');
            notification.textContent = newState ? 'Easy mode enabled!' : 'Easy mode disabled';
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-family: "Geist", system-ui, sans-serif;
                font-size: 14px;
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
            `;
            document.body.appendChild(notification);
            
            TweenLite.to(notification, 0.3, {
                opacity: 1,
                ease: Power2.easeOut,
                onComplete: () => {
                    TweenLite.to(notification, 0.3, {
                        opacity: 0,
                        delay: 1,
                        ease: Power2.easeIn,
                        onComplete: () => notification.remove()
                    });
                }
            });
        }
    });
})();

// Faster blocks toggle
(function () {
    const fasterBlocksToggle = document.querySelector('.faster-blocks-toggle');
    if (!fasterBlocksToggle)
        return;
    
    const updateFasterBlocksButton = () => {
        try {
            const isEnabled = window.localStorage.getItem(FASTER_BLOCKS_KEY) === 'true';
            fasterBlocksToggle.textContent = isEnabled ? 'Faster Blocks: ON' : 'Faster Blocks';
            if (isEnabled) {
                fasterBlocksToggle.style.fontWeight = '600';
                fasterBlocksToggle.style.color = '#FF6B35';
            } else {
                fasterBlocksToggle.style.fontWeight = '500';
                fasterBlocksToggle.style.color = '';
            }
        } catch (e) {
            fasterBlocksToggle.textContent = 'Faster Blocks';
        }
    };
    
    // Initialize button state
    updateFasterBlocksButton();
    
    fasterBlocksToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const gameInstance = window.game || game;
        if (gameInstance && gameInstance.toggleFasterBlocks) {
            const newState = gameInstance.toggleFasterBlocks();
            updateFasterBlocksButton();
            
            // Update the currently active block's speed immediately
            if (gameInstance.updateCurrentBlockSpeed) {
                gameInstance.updateCurrentBlockSpeed();
            }
            
            // Animate button
            TweenLite.to(fasterBlocksToggle, 0.2, {
                scale: 0.95,
                ease: Power2.easeOut,
                onComplete: () => {
                    TweenLite.to(fasterBlocksToggle, 0.3, {
                        scale: 1,
                        ease: Power2.easeOut
                    });
                }
            });
            
            // Show notification
            const notification = document.createElement('div');
            notification.textContent = newState ? 'Faster blocks enabled!' : 'Faster blocks disabled';
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-family: "Geist", system-ui, sans-serif;
                font-size: 14px;
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
            `;
            document.body.appendChild(notification);
            
            TweenLite.to(notification, 0.3, {
                opacity: 1,
                ease: Power2.easeOut,
                onComplete: () => {
                    TweenLite.to(notification, 0.3, {
                        opacity: 0,
                        delay: 1,
                        ease: Power2.easeIn,
                        onComplete: () => notification.remove()
                    });
                }
            });
        }
    });
})();