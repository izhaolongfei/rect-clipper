/**
 * @file 图片剪裁
 * @author zhaolongfei@baidu.com
 */

export default class BoxClipper {
    constructor(options = {}) {
        const {
            scale = 1, rotate = 0, ratio = 0, coords, limitCoords, minWidth = 60, minHeight = 60, dragRadius
        } = options;
        this.scale = scale;
        this.rotate = rotate;
        this.ratio = ratio; // 拖拽区域比例：height/width，大于 0 有效
        this.coords = coords; // [left, top, right, bottom]，left／right都相对于容器左侧；top／bottom都相对于容器顶部;(x1, y1, x2, y2)
        this.limitCoords = limitCoords; // 可拖拽范围
        this.minWidth = minWidth;
        this.minHeight = minHeight;
        this.dragRadius = dragRadius; // 以四角为圆心的可操作半径
    }

    setRotateDegree(degree) {
        this.rotate = degree;
    }

    setScale(scale) {
        this.scale = scale;
    }

    updateClipPositionAfterRotate(position) {
        if (this.rotate === -90) {
            // 逆时针90
            const top = position.top;
            position.top = position.left;
            position.left = position.bottom;
            position.bottom = position.right;
            position.right = top;
        } else if (this.rotate === -180) {
            const top = position.top;
            const left = position.left;
            position.top = position.bottom;
            position.left = position.right;
            position.bottom = top;
            position.right = left;
        } else if (this.rotate === -270) {
            const top = position.top;
            const left = position.left;
            const bottom = position.bottom;
            position.top = position.right;
            position.left = top;
            position.bottom = left;
            position.right = bottom;
        }
    }

    onClipStart(startX, startY, startX2, startY2) {
        this.startX = startX;
        this.startY = startY;
        this.startX2 = startX2;
        this.startY2 = startY2;
        this.oriStartX = startX;
        this.oriStartY = startY;
        this.oriStartX2 = startX2;
        this.oriStartY2 = startY2;
    }

    onClipMove(moveX, moveY, moveX2, moveY2, cb) {
        this.doClip(moveX, moveY, moveX2, moveY2, coords => {
            this.startX = moveX;
            this.startY = moveY;
            this.startX2 = moveX2;
            this.startY2 = moveY2;
            cb(coords);
        });
    }

    onClipEnd(endX, endY, endX2, endY2, cb) {
        // TODO
    }

    doClip(endX, endY, endX2, endY2, cb) {
        if (!this.coords) {
            return;
        }

        // 移动的距离
        const moveX = endX - this.startX;
        const moveY = endY - this.startY;

        // 双指操作
        if (endX2 && endY2) {
            this.dragDoubleFingers(endX, endY, endX2, endY2);
        } else if (this.ratio) {
            this.dragRatio(moveX, moveY);
        } else {
            this.dragNormal(endX, endY);
        }

        cb(this.coords);
    }

    dragNormal(moveX, moveY) {
        const distX = Math.abs(moveX - this.startX);
        const distY = Math.abs(moveY - this.startY);

        let direction = '';

        if (distX > 0) {
            direction += 'h'; // 水平

            if (moveX - this.startX > 0) {
                direction += '2r';
            } else {
                direction += '2l';
            }
        }

        if (distY > 0) {
            direction += 'v'; // 垂直

            if (moveY - this.startY < 0) {
                direction += '2t';
            } else {
                direction += '2b';
            }
        }

        const dragLeft = this.startX - this.coords[0] <= this.dragRadius;
        const dragTop = this.startY - this.coords[1] <= this.dragRadius;
        const dragRight = this.coords[2] - this.startX <= this.dragRadius;
        const dragBottom = this.coords[3] - this.startY <= this.dragRadius;

        const dragLeftTop = dragLeft && dragTop;
        const dragLeftBottom = dragLeft && dragBottom;
        const dragRightTop = dragRight && dragTop;
        const dragRightBottom = dragRight && dragBottom;

        // 保持拖拽区域比例，不允许四边拖拽
        const dragInner = !dragLeft && !dragTop && !dragRight && !dragBottom;

        // 移动位置
        let tmpCoords = [...this.coords];

        if (direction.indexOf('h2r') !== -1) {
            if (dragLeft) {
                tmpCoords[0] = this.coords[0] + distX;
                // 最小框选区域限制
                if (tmpCoords[2] - tmpCoords[0] < this.minWidth) {
                    tmpCoords[0] = tmpCoords[2] - this.minWidth;
                }
            } else if (dragRight) {
                tmpCoords[2] = this.coords[2] + distX;
                // 不能超出原始框选右边界
                if (tmpCoords[2] > this.limitCoords[2]) {
                    tmpCoords[2] = this.limitCoords[2];
                }
            } else if (dragInner) {
                tmpCoords[2] = this.coords[2] + distX;
                // 不能超出原始框选右边界
                if (tmpCoords[2] > this.limitCoords[2]) {
                    tmpCoords[2] = this.limitCoords[2];
                }
                // 平移
                tmpCoords[0] = tmpCoords[2] - (this.coords[2] - this.coords[0]);
            }
        } else if (direction.indexOf('h2l') !== -1) {
            if (dragLeft) {
                tmpCoords[0] = this.coords[0] - distX;
                // 不能超出原始框选左边界
                if (tmpCoords[0] < this.limitCoords[0]) {
                    tmpCoords[0] = this.limitCoords[0];
                }
            } else if (dragRight) {
                tmpCoords[2] = this.coords[2] - distX;
                // 最小框选区域限制
                if (tmpCoords[2] - tmpCoords[0] < this.minWidth) {
                    tmpCoords[2] = tmpCoords[0] + this.minWidth;
                }
            } else if (dragInner) {
                tmpCoords[0] = this.coords[0] - distX;
                // 不能超出原始框选左边界
                if (tmpCoords[0] < this.limitCoords[0]) {
                    tmpCoords[0] = this.limitCoords[0];
                }
                // 平移
                tmpCoords[2] = tmpCoords[0] + (this.coords[2] - this.coords[0]);
            }
        }

        if (direction.indexOf('v2t') !== -1) {
            if (dragTop) {
                tmpCoords[1] = this.coords[1] - distY;
                // 不能超出原始框选上边界
                if (tmpCoords[1] < this.limitCoords[1]) {
                    tmpCoords[1] = this.limitCoords[1];
                }
            } else if (dragBottom) {
                tmpCoords[3] = this.coords[3] - distY;
                // 最小框选区域限制
                if (tmpCoords[3] - tmpCoords[1] < this.minHeight) {
                    tmpCoords[3] = tmpCoords[1] + this.minHeight;
                }
            } else if (dragInner) {
                tmpCoords[1] = this.coords[1] - distY;
                // 不能超出原始框选上边界
                if (tmpCoords[1] < this.limitCoords[1]) {
                    tmpCoords[1] = this.limitCoords[1];
                }
                tmpCoords[3] = tmpCoords[1] + (this.coords[3] - this.coords[1]);
            }
        } else if (direction.indexOf('v2b') !== -1) {
            if (dragTop) {
                tmpCoords[1] = this.coords[1] + distY;
                // 最小框选区域限制
                if (tmpCoords[3] - tmpCoords[1] < this.minHeight) {
                    tmpCoords[1] = tmpCoords[3] - this.minHeight;
                }
            } else if (dragBottom) {
                tmpCoords[3] = this.coords[3] + distY;
                // 不能超出原始框选下边界
                if (tmpCoords[3] > this.limitCoords[3]) {
                    tmpCoords[3] = this.limitCoords[3];
                }
            } else if (dragInner) {
                tmpCoords[3] = this.coords[3] + distY;
                // 不能超出原始框选下边界
                if (tmpCoords[3] > this.limitCoords[3]) {
                    tmpCoords[3] = this.limitCoords[3];
                }
                tmpCoords[1] = tmpCoords[3] - (this.coords[3] - this.coords[1]);
            }
        }

        if (dragLeftTop || dragLeftBottom || dragRightTop || dragRightBottom || dragInner) {
            // 如果是四角拖拽 || 内部整体拖拽
            this.coords = tmpCoords;
        } else if (distX >= distY) {
            // 水平拖拽
            this.coords[0] = tmpCoords[0];
            this.coords[2] = tmpCoords[2];
        } else if (distX < distY) {
            // 垂直拖拽
            this.coords[1] = tmpCoords[1];
            this.coords[3] = tmpCoords[3];
        }

        this.coords = tmpCoords;
    }

    dragRatio(moveX, moveY) {
        const distX = Math.abs(moveX);
        const distY = Math.abs(moveY);

        let dragLeft = Math.abs(this.startX - this.coords[0]) <= this.dragRadius;
        let dragTop = Math.abs(this.startY - this.coords[1]) <= this.dragRadius;
        let dragRight = Math.abs(this.startX - this.coords[2]) <= this.dragRadius;
        let dragBottom = Math.abs(this.startY - this.coords[3]) <= this.dragRadius;

        const dragLeftTop = dragLeft && dragTop;
        const dragLeftBottom = dragLeft && dragBottom;
        const dragRightTop = dragRight && dragTop;
        const dragRightBottom = dragRight && dragBottom;

        let tmpCoords = [...this.coords];

        if (dragLeftTop) {
            if (distX >= distY) {
                // 以 x 轴方向为主
                tmpCoords[0] += moveX;
                let tw = tmpCoords[2] - tmpCoords[0];
                if (tw < this.minWidth) {
                    tw = this.minWidth;
                    tmpCoords[0] = tmpCoords[2] - this.minWidth;
                }
                const th = tw * this.ratio;
                tmpCoords[1] = tmpCoords[3] - th;
            } else {
                // 以 y 轴方向为主
                tmpCoords[1] -= moveY;
                let th = tmpCoords[3] - tmpCoords[1];
                if (th < this.minHeight) {
                    th = this.minHeight;
                    tmpCoords[1] = tmpCoords[3] - this.minHeight;
                }
                const tw = th / this.ratio;
                tmpCoords[0] = tmpCoords[2] - tw;
            }
        } else if (dragLeftBottom) {
            if (distX >= distY) {
                // 以 x 轴方向为主
                tmpCoords[0] += moveX;
                let tw = tmpCoords[2] - tmpCoords[0];
                if (tw < this.minWidth) {
                    tw = this.minWidth;
                    tmpCoords[0] = tmpCoords[2] - this.minWidth;
                }
                const th = tw * this.ratio;
                tmpCoords[3] = tmpCoords[1] + th;
            } else {
                // 以 y 轴方向为主
                tmpCoords[3] += moveY;
                let th = tmpCoords[3] - tmpCoords[1];
                if (th < this.minHeight) {
                    th = this.minHeight;
                    tmpCoords[3] = tmpCoords[1] + this.minHeight;
                }
                const tw = th / this.ratio;
                tmpCoords[0] = tmpCoords[2] - tw;
            }
        } else if (dragRightTop) {
            if (distX >= distY) {
                // 以 x 轴方向为主
                tmpCoords[2] += moveX;
                let tw = tmpCoords[2] - tmpCoords[0];
                if (tw < this.minWidth) {
                    tw = this.minWidth;
                    tmpCoords[2] = tmpCoords[0] + this.minWidth;
                }
                const th = tw * this.ratio;
                tmpCoords[1] = tmpCoords[3] - th;
            } else {
                // 以 y 轴方向为主
                tmpCoords[1] -= moveY;
                let th = tmpCoords[3] - tmpCoords[1];
                if (th < this.minHeight) {
                    th = this.minHeight;
                    tmpCoords[1] = tmpCoords[3] - this.minHeight;
                }
                const tw = th / this.ratio;
                tmpCoords[2] = tmpCoords[0] + tw;
            }
        } else if (dragRightBottom) {
            if (distX >= distY) {
                // 以 x 轴方向为主
                tmpCoords[2] += moveX;
                let tw = tmpCoords[2] - tmpCoords[0];
                if (tw < this.minWidth) {
                    tw = this.minWidth;
                    tmpCoords[2] = tmpCoords[0] + this.minWidth;
                }
                const th = tw * this.ratio;
                tmpCoords[3] = tmpCoords[1] + th;
            } else {
                // 以 y 轴方向为主
                tmpCoords[3] += moveY;
                let th = tmpCoords[3] - tmpCoords[1];
                if (th < this.minHeight) {
                    th = this.minHeight;
                    tmpCoords[3] = tmpCoords[1] + this.minHeight;
                }
                const tw = th / this.ratio;
                tmpCoords[2] = tmpCoords[0] + tw;
            }
        } else {
            tmpCoords[0] += moveX;
            tmpCoords[1] += moveY;
            tmpCoords[2] += moveX;
            tmpCoords[3] += moveY;
        }

        this.coords = tmpCoords;
    }

    dragDoubleFingers(moveX, moveY, moveX2, moveY2) {
        const distX = Math.abs(this.startX2 - this.startX);
        const distX2 = Math.abs(moveX2 - moveX);
        let ex = Math.abs(distX2 - distX) * 3;
        const distY = Math.abs(this.startY2 - this.startY);
        const distY2 = Math.abs(moveY2 - moveY);
        let ey = Math.abs(distY2 - distY) * 3;

        let tmpCoords = [...this.coords];

        // 以中心缩放
        if (ex >= ey) {
            // 以 x 为主
            if (distX2 >= distX) {
                // 放大
                tmpCoords[0] -= ex / 2;
                tmpCoords[2] += ex / 2;
                const tw = tmpCoords[2] - tmpCoords[0] + ex;
                const th = tw * this.ratio;
                ey = th - (tmpCoords[3] - tmpCoords[1]);
                tmpCoords[1] -= ey / 2;
                tmpCoords[3] += ey / 2;
            } else {
                // 缩小
                if (tmpCoords[2] - tmpCoords[0] - ex < this.minWidth) {
                    ex = tmpCoords[2] - tmpCoords[0] - this.minWidth;
                }
                tmpCoords[0] += ex / 2;
                tmpCoords[2] -= ex / 2;
                let tw = tmpCoords[2] - tmpCoords[0] - ex;
                const th = tw * this.ratio;
                ey = (tmpCoords[3] - tmpCoords[1]) - th;
                tmpCoords[1] += ey / 2;
                tmpCoords[3] -= ey / 2;
            }
        } else {
            // 以 y 为主
            if (distY2 >= distY) {
                // 放大
                tmpCoords[1] -= ey / 2;
                tmpCoords[3] += ey / 2;
                const th = tmpCoords[3] - tmpCoords[1];
                const tw = th / this.ratio;
                ex = tw - (tmpCoords[2] - tmpCoords[0]);
                tmpCoords[0] -= ex / 2;
                tmpCoords[2] += ex / 2;
            } else {
                // 缩小
                if (tmpCoords[3] - tmpCoords[1] - ey < this.minHeight) {
                    ey = tmpCoords[3] - tmpCoords[1] - this.minHeight;
                }
                tmpCoords[1] += ey / 2;
                tmpCoords[3] -= ey / 2;
                const th = tmpCoords[3] - tmpCoords[1];
                const tw = th / this.ratio;
                ex = (tmpCoords[2] - tmpCoords[0]) - tw;
                tmpCoords[0] += ex / 2;
                tmpCoords[2] -= ex / 2;
            }
        }

        this.coords = tmpCoords;
    }
}
