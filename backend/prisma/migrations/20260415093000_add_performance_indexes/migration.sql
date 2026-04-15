-- Indexes for evaluation batch queries and farmer distribution lookups.
CREATE INDEX "User_role_isActive_createdAt_idx"
ON "User"("role", "isActive", "createdAt");

CREATE INDEX "Sheep_ownerUserId_status_idx"
ON "Sheep"("ownerUserId", "status");

CREATE INDEX "Sheep_createdById_createdAt_idx"
ON "Sheep"("createdById", "createdAt");

CREATE INDEX "SheepWeight_sheepId_recordDate_idx"
ON "SheepWeight"("sheepId", "recordDate" DESC);

CREATE INDEX "SheepWeight_createdById_createdAt_idx"
ON "SheepWeight"("createdById", "createdAt");

CREATE INDEX "SheepBCS_sheepId_recordDate_idx"
ON "SheepBCS"("sheepId", "recordDate" DESC);

CREATE INDEX "SheepBCS_createdById_createdAt_idx"
ON "SheepBCS"("createdById", "createdAt");

CREATE INDEX "SheepHealth_sheepId_checkDate_idx"
ON "SheepHealth"("sheepId", "checkDate" DESC);

CREATE INDEX "SheepHealth_createdById_createdAt_idx"
ON "SheepHealth"("createdById", "createdAt");

CREATE INDEX "SheepReproduction_sheepId_createdAt_idx"
ON "SheepReproduction"("sheepId", "createdAt" DESC);

CREATE INDEX "SheepReproduction_createdById_createdAt_idx"
ON "SheepReproduction"("createdById", "createdAt");

CREATE INDEX "ActivityLog_userId_createdAt_idx"
ON "ActivityLog"("userId", "createdAt");

CREATE INDEX "ActivityLog_sheepId_createdAt_idx"
ON "ActivityLog"("sheepId", "createdAt");
