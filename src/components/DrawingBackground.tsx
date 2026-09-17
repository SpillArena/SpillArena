import { motion } from 'framer-motion'

const orbs = [
    { x: '4%', y: '6%', size: 460, color: 'color-mix(in srgb, var(--accent) 22%, transparent)', duration: 26 },
    { x: '86%', y: '10%', size: 360, color: 'color-mix(in srgb, var(--accent) 14%, transparent)', duration: 32 },
    { x: '18%', y: '82%', size: 420, color: 'color-mix(in srgb, var(--accent) 16%, transparent)', duration: 28 },
    { x: '92%', y: '88%', size: 300, color: 'color-mix(in srgb, var(--accent) 20%, transparent)', duration: 22 },
]

export default function DrawingBackground() {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            {orbs.map((orb, index) => (
                <motion.div
                    key={`orb-${index}`}
                    className="absolute rounded-full blur-3xl"
                    style={{
                        left: orb.x,
                        top: orb.y,
                        width: orb.size,
                        height: orb.size,
                        background: orb.color,
                    }}
                    animate={{
                        x: [0, 30, -20, 0],
                        y: [0, -24, 16, 0],
                        scale: [1, 1.08, 0.95, 1],
                    }}
                    transition={{
                        duration: orb.duration,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    )
}
