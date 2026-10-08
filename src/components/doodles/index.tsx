import { ArrowSe, Fork, Spoon, Star, WaveRight, Zap } from '@doodle-icons/react-native';
import type { ComponentType } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface DoodleProps {
  size?: number;
  color: string;
  rotation?: number;
  opacity?: number;
}

type IconProps = { size?: number | string; color?: string; style?: object };

function IconDoodle({ icon: Icon, size = 28, color, rotation = 0, opacity = 1 }: DoodleProps & { icon: ComponentType<IconProps> }) {
  return <Icon size={size} color={color} style={{ transform: [{ rotate: `${rotation}deg` }], opacity }} />;
}

export function DoodleStar(props: DoodleProps) { return <IconDoodle icon={Star} {...props} />; }
export function DoodleSpark(props: DoodleProps) { return <IconDoodle icon={Zap} {...props} />; }
export function DoodleArrow(props: DoodleProps) { return <IconDoodle icon={ArrowSe} {...props} />; }
export function DoodleSwirl(props: DoodleProps) { return <IconDoodle icon={WaveRight} {...props} />; }

export function DoodleUnderline({ size = 112, color, rotation = 0, opacity = 1 }: DoodleProps) {
  return <Svg width={size} height={Math.max(12, size * 0.15)} viewBox="0 0 112 17" style={{ transform: [{ rotate: `${rotation}deg` }], opacity }}>
    <Path d="M3 12.5C24 5.5 52 6.5 77 7.8c13 .7 23 2.7 32 2" stroke={color} strokeWidth="3.2" strokeLinecap="round" fill="none" />
    <Path d="M26 15c25-5 55-5 75-3" stroke={color} strokeWidth="1.7" strokeLinecap="round" fill="none" opacity={0.7} />
  </Svg>;
}

export function DoodleBurst({ size = 72, color, rotation = 0, opacity = 1 }: DoodleProps) {
  return <View style={{ width: size, height: size, transform: [{ rotate: `${rotation}deg` }], opacity }}>
    <View style={{ position: 'absolute', left: size * 0.04, top: size * 0.1 }}><DoodleStar size={size * 0.62} color={color} /></View>
    <View style={{ position: 'absolute', right: 0, bottom: 0 }}><DoodleSpark size={size * 0.4} color={color} rotation={18} /></View>
  </View>;
}

export function DoodleFoodAccent({ size = 44, color, rotation = 0, opacity = 1 }: DoodleProps) {
  return <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'center', transform: [{ rotate: `${rotation}deg` }], opacity }}>
    <Fork size={size * 0.52} color={color} />
    <Spoon size={size * 0.52} color={color} />
  </View>;
}
