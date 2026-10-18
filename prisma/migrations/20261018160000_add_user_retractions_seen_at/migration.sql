-- AlterTable
ALTER TABLE "User" ADD COLUMN "retractionsSeenAt" DATETIME;

-- existing users have already noticed past retractions - only new ones are marked
UPDATE "User" SET "retractionsSeenAt" = strftime('%Y-%m-%dT%H:%M:%f+00:00', 'now');
