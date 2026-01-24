-- CreateIndex
CREATE INDEX "KycAppeal_status_createdAt_idx" ON "KycAppeal"("status", "createdAt");

-- CreateIndex
CREATE INDEX "KycApplication_status_submittedAt_idx" ON "KycApplication"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "Ticket_status_createdAt_idx" ON "Ticket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");
