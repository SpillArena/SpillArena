import type { LucideIcon } from 'lucide-react'
import { Anchor, Bot, Dice5, Gamepad2, PenTool, Trophy, Type } from 'lucide-react'

interface Item {
    Icon: LucideIcon
    x: number
    y: number
    rotate: number
    size: number
    opacity: number
}

const items: Item[] = [
    { Icon: Anchor, x: 5, y: 10, rotate: -18, size: 15, opacity: 0.14 },
    { Icon: Anchor, x: 88, y: 16, rotate: 42, size: 13, opacity: 0.13 },
    { Icon: Anchor, x: 48, y: 92, rotate: -10, size: 16, opacity: 0.135 },

    { Icon: Type, x: 16, y: 35, rotate: 20, size: 15, opacity: 0.135 },
    { Icon: Type, x: 91, y: 46, rotate: -35, size: 14, opacity: 0.13 },
    { Icon: Type, x: 60, y: 6, rotate: 15, size: 13, opacity: 0.12 },

    { Icon: PenTool, x: 78, y: 40, rotate: 30, size: 13, opacity: 0.13 },
    { Icon: PenTool, x: 10, y: 65, rotate: -45, size: 14, opacity: 0.135 },
    { Icon: PenTool, x: 54, y: 69, rotate: 10, size: 12, opacity: 0.12 },

    { Icon: Gamepad2, x: 72, y: 78, rotate: 55, size: 14, opacity: 0.125 },
    { Icon: Gamepad2, x: 30, y: 85, rotate: -20, size: 15, opacity: 0.135 },
    { Icon: Gamepad2, x: 93, y: 70, rotate: -30, size: 13, opacity: 0.13 },

    { Icon: Bot, x: 38, y: 18, rotate: -15, size: 15, opacity: 0.13 },
    { Icon: Bot, x: 82, y: 88, rotate: 25, size: 14, opacity: 0.135 },
    { Icon: Bot, x: 22, y: 52, rotate: -5, size: 14, opacity: 0.13 },

    { Icon: Trophy, x: 42, y: 42, rotate: 35, size: 13, opacity: 0.12 },
    { Icon: Trophy, x: 18, y: 15, rotate: -30, size: 14, opacity: 0.13 },
    { Icon: Trophy, x: 75, y: 55, rotate: 18, size: 12, opacity: 0.12 },

    { Icon: Dice5, x: 68, y: 25, rotate: 12, size: 13, opacity: 0.12 },
    { Icon: Dice5, x: 85, y: 62, rotate: -20, size: 15, opacity: 0.13 },
    { Icon: Dice5, x: 3, y: 88, rotate: 20, size: 14, opacity: 0.13 },
]

export default function DrawingBackground() {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            {items.map((item, index) => (
                <div
                    key={`${item.Icon.displayName ?? 'icon'}-${index}`}
                    className="absolute text-black/100 dark:text-white"
                    style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`,
                        opacity: item.opacity,
                    }}
                >
                    <item.Icon size={item.size} strokeWidth={1.4} />
                </div>
            ))}
        </div>
    )
}