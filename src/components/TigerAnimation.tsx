
import React, { useEffect, useRef } from 'react';

const TigerAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to fill the screen
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Tiger head configuration
    const tiger = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      size: Math.min(canvas.width, canvas.height) * 0.3,
      velocityX: 1.5,
      velocityY: 1,
      bounceDelay: 0
    };
    
    // Animation properties
    let rotation = 0;
    let pulseFactor = 1;
    let pulseDirection = 0.005;
    
    // Draw tiger head function
    const drawTigerHead = (x: number, y: number, size: number, rotation: number, pulseFactor: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(pulseFactor, pulseFactor);
      
      // Tiger face (orange circle)
      ctx.beginPath();
      ctx.fillStyle = '#F58025'; // Princeton orange
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Ears
      ctx.beginPath();
      ctx.fillStyle = '#F58025';
      ctx.moveTo(-size / 2, -size / 2.5);
      ctx.lineTo(-size / 4, -size / 1.2);
      ctx.lineTo(-size / 1.5, -size / 4);
      ctx.fill();
      
      ctx.beginPath();
      ctx.fillStyle = '#F58025';
      ctx.moveTo(size / 2, -size / 2.5);
      ctx.lineTo(size / 4, -size / 1.2);
      ctx.lineTo(size / 1.5, -size / 4);
      ctx.fill();
      
      // Inner ears
      ctx.beginPath();
      ctx.fillStyle = '#222222';
      ctx.moveTo(-size / 2.5, -size / 2.5);
      ctx.lineTo(-size / 3.5, -size / 1.4);
      ctx.lineTo(-size / 1.8, -size / 3.5);
      ctx.fill();
      
      ctx.beginPath();
      ctx.fillStyle = '#222222';
      ctx.moveTo(size / 2.5, -size / 2.5);
      ctx.lineTo(size / 3.5, -size / 1.4);
      ctx.lineTo(size / 1.8, -size / 3.5);
      ctx.fill();
      
      // Eyes (white background)
      ctx.beginPath();
      ctx.fillStyle = '#FFFFFF';
      ctx.ellipse(-size / 5, -size / 8, size / 10, size / 7, 0, 0, Math.PI * 2);
      ctx.ellipse(size / 5, -size / 8, size / 10, size / 7, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupils
      ctx.beginPath();
      ctx.fillStyle = '#000000';
      ctx.ellipse(-size / 5, -size / 8, size / 20, size / 12, 0, 0, Math.PI * 2);
      ctx.ellipse(size / 5, -size / 8, size / 20, size / 12, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Tiger stripes
      ctx.lineWidth = size / 25;
      ctx.strokeStyle = '#000000';
      
      // Forehead stripe
      ctx.beginPath();
      ctx.moveTo(-size / 4, -size / 4);
      ctx.lineTo(size / 4, -size / 4);
      ctx.stroke();
      
      // Cheek stripes left
      ctx.beginPath();
      ctx.moveTo(-size / 3, 0);
      ctx.lineTo(-size / 2, size / 5);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(-size / 3.5, size / 8);
      ctx.lineTo(-size / 2.2, size / 3);
      ctx.stroke();
      
      // Cheek stripes right
      ctx.beginPath();
      ctx.moveTo(size / 3, 0);
      ctx.lineTo(size / 2, size / 5);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(size / 3.5, size / 8);
      ctx.lineTo(size / 2.2, size / 3);
      ctx.stroke();
      
      // Nose
      ctx.beginPath();
      ctx.fillStyle = '#000000';
      ctx.moveTo(0, size / 10);
      ctx.lineTo(-size / 15, 0);
      ctx.lineTo(size / 15, 0);
      ctx.fill();
      
      // Mouth
      ctx.beginPath();
      ctx.moveTo(0, size / 10);
      ctx.lineTo(0, size / 6);
      ctx.stroke();
      
      // Whiskers
      ctx.lineWidth = size / 60;
      
      // Left whiskers
      ctx.beginPath();
      ctx.moveTo(-size / 15, size / 15);
      ctx.lineTo(-size / 2.5, size / 10);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(-size / 15, size / 10);
      ctx.lineTo(-size / 2.5, size / 6);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(-size / 15, size / 7);
      ctx.lineTo(-size / 3, size / 4);
      ctx.stroke();
      
      // Right whiskers
      ctx.beginPath();
      ctx.moveTo(size / 15, size / 15);
      ctx.lineTo(size / 2.5, size / 10);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(size / 15, size / 10);
      ctx.lineTo(size / 2.5, size / 6);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(size / 15, size / 7);
      ctx.lineTo(size / 3, size / 4);
      ctx.stroke();
      
      ctx.restore();
    };
    
    // Animation loop
    const animate = () => {
      // Clear canvas with semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update position
      if (tiger.bounceDelay <= 0) {
        tiger.x += tiger.velocityX;
        tiger.y += tiger.velocityY;
        
        // Bounce off the edges
        if (tiger.x - tiger.size/2 <= 0 || tiger.x + tiger.size/2 >= canvas.width) {
          tiger.velocityX *= -1;
          tiger.bounceDelay = 10;
          rotation = Math.random() * 0.3 - 0.15;
        }
        
        if (tiger.y - tiger.size/2 <= 0 || tiger.y + tiger.size/2 >= canvas.height) {
          tiger.velocityY *= -1;
          tiger.bounceDelay = 10;
          rotation = Math.random() * 0.3 - 0.15;
        }
      } else {
        tiger.bounceDelay--;
      }
      
      // Update pulse effect
      pulseFactor += pulseDirection;
      if (pulseFactor >= 1.05) {
        pulseDirection = -0.005;
      } else if (pulseFactor <= 0.95) {
        pulseDirection = 0.005;
      }
      
      // Draw the tiger head
      drawTigerHead(tiger.x, tiger.y, tiger.size, rotation, pulseFactor);
      
      // Continue the animation
      requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 opacity-30"
      data-testid="tiger-animation"
      aria-hidden="true"
    />
  );
};

export default TigerAnimation;
