import React, { Component, ReactNode, useState } from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('ShaderGradient Canvas Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface MeshGradientBgProps {
  color1?: string;
  color2?: string;
  color3?: string;
  uSpeed?: number;
  rotationY?: number;
}

export const MeshGradientBg = React.memo(function MeshGradientBg({
  color1 = '#73bfc4',
  color2 = '#ff810a',
  color3 = '#8da0ce',
  uSpeed = 0.25,
  rotationY = 130,
}: MeshGradientBgProps) {
  const fallbackUI = (
    <div className="absolute inset-0 bg-slate-950 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#73bfc4] rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-pulse" />
      <div
        className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#ff810a] rounded-full mix-blend-screen filter blur-[140px] opacity-35 animate-spin"
        style={{ animationDuration: '30s' }}
      />
      <div className="absolute bottom-1/4 left-1/3 w-[550px] h-[550px] bg-[#8da0ce] rounded-full mix-blend-screen filter blur-[130px] opacity-40 animate-pulse" />
    </div>
  );

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      <CanvasErrorBoundary fallback={fallbackUI}>
        <ShaderGradientCanvas
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          lazyLoad={undefined}
          fov={undefined}
          pixelDensity={1}
          pointerEvents="none"
        >
          <ShaderGradient
            animate="on"
            type="sphere"
            wireframe={false}
            shader="defaults"
            uTime={0}
            uSpeed={uSpeed}
            uStrength={0.3}
            uDensity={0.8}
            uFrequency={5.5}
            uAmplitude={3.2}
            positionX={-0.1}
            positionY={0}
            positionZ={0}
            rotationX={0}
            rotationY={rotationY}
            rotationZ={70}
            color1={color1}
            color2={color2}
            color3={color3}
            reflection={0.4}
            cAzimuthAngle={270}
            cPolarAngle={180}
            cDistance={0.5}
            cameraZoom={15.1}
            lightType="env"
            brightness={0.8}
            envPreset="city"
            grain="off"
            toggleAxis={false}
            zoomOut={false}
            hoverState=""
            enableTransition={false}
          />
        </ShaderGradientCanvas>
      </CanvasErrorBoundary>
    </div>
  );
});
