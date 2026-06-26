-- CreateTable
CREATE TABLE "reasons" (
    "id" BIGSERIAL NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "emoji" VARCHAR(16),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reasons_label_key" ON "reasons"("label");

-- Seed（种子）：内置 16 项拉黑原因，保持原有顺序与 emoji；created_by=0 代表系统内置。
-- 升级部署后即时可用，与改造前完全一致，无空列表窗口。
INSERT INTO "reasons" ("label", "emoji", "sort_order", "created_by") VALUES
    ('桩机',       '🔨',  1,  0),
    ('粗大长',     '📏',  2,  0),
    ('磕药',       '💊',  3,  0),
    ('变态',       '😈',  4,  0),
    ('SM',         '⛓️',  5,  0),
    ('跑单',       '🏃',  6,  0),
    ('专门看人',   '👀',  7,  0),
    ('同行',       '👥',  8,  0),
    ('中介',       '🤝',  9,  0),
    ('吸毒',       '💉', 10,  0),
    ('抢劫或偷盗', '🦹', 11,  0),
    ('诈骗',       '💰', 12,  0),
    ('暴力',       '👊', 13,  0),
    ('素质不高',   '👎', 14,  0),
    ('个人卫生差', '🧼', 15,  0),
    ('钓鱼',       '🎣', 16,  0);
