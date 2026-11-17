/**
 * 多只桌面宠物同角落启动时，按垂直方向自动错开。
 * 只影响本次启动参数，不写回配置；已有 x/y 的手动位置不参与。
 */
export function arrangeDesktopPets(pets) {
    const offsets = new Map();
    return pets.map((pet) => {
        if (!['desktop', 'both'].includes(pet.display ?? 'web'))
            return pet;
        if (typeof pet.position?.x === 'number' && typeof pet.position?.y === 'number') {
            return pet;
        }
        const corner = pet.position?.corner ?? 'top-right';
        const height = Math.round(((pet.size ?? 420) * 9) / 16);
        const offset = offsets.get(corner) ?? 0;
        offsets.set(corner, offset + height + 12);
        if (offset === 0)
            return pet;
        return {
            ...pet,
            position: {
                ...(pet.position ?? { corner }),
                marginY: (pet.position?.marginY ?? 100) + offset,
            },
        };
    });
}
