-- AlterTable
ALTER TABLE "Model" ADD CONSTRAINT "Model_slug_key" UNIQUE ("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ModelProviderMapping_modelId_providerId_key" ON "ModelProviderMapping"("modelId", "providerId");
