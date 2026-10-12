const openers = new Set<() => void>()

/** Opens the account panel from elsewhere in the game, e.g. when an action needs a signed-in player. */
export function openAccountPanel(): void {
    for (const open of openers) open()
}

/** @internal Used by AccountBadge to hear openAccountPanel(). */
export function onOpenAccountPanel(open: () => void): () => void {
    openers.add(open)
    return () => {
        openers.delete(open)
    }
}
