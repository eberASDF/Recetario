import { InterfaceScan, ScanFingerprint } from '@doodle-icons/react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { BiometricCapability } from '@/services/BiometricService';

interface Props { capability: BiometricCapability | null; color: string; size: number; }

export function BiometricSymbol({ capability, color, size }: Props) {
  if (capability?.supportsFingerprint && !capability.supportsFace && !capability.supportsIris) return <ScanFingerprint color={color} size={size} />;
  if (capability?.supportsFace && !capability.supportsFingerprint && !capability.supportsIris) return <FaceScan color={color} size={size} />;
  return <InterfaceScan color={color} size={size} />;
}

function FaceScan({ color, size }: { color: string; size: number }) {
  return <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <Path d="M10 28V17c0-4 3-7 7-7h11M52 10h11c4 0 7 3 7 7v11M70 52v11c0 4-3 7-7 7H52M28 70H17c-4 0-7-3-7-7V52" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M25 34c2-2 5-2 7 0m16 0c2-2 5-2 7 0M40 35l-2 10c2 2 4 2 6 1m-16 7c8 7 17 7 24-1" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="29" cy="38" r="1.3" fill={color} /><Circle cx="51" cy="38" r="1.3" fill={color} />
  </Svg>;
}
