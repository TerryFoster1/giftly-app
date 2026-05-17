export type SecretSantaDrawPair = {
  giverParticipantId: string;
  recipientParticipantId: string;
};

type DrawInput = {
  participantIds: string[];
  exclusions?: Array<{ participantAId: string; participantBId: string }>;
  rng?: () => number;
};

function shuffle<T>(items: T[], rng: () => number) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function exclusionKey(a: string, b: string) {
  return `${a}::${b}`;
}

export function generateSecretSantaDraw({ participantIds, exclusions = [], rng = Math.random }: DrawInput): SecretSantaDrawPair[] {
  const uniqueParticipants = Array.from(new Set(participantIds));
  if (uniqueParticipants.length < 3) throw new Error("SECRET_SANTA_MIN_PARTICIPANTS");

  const blocked = new Set<string>();
  for (const exclusion of exclusions) {
    blocked.add(exclusionKey(exclusion.participantAId, exclusion.participantBId));
    blocked.add(exclusionKey(exclusion.participantBId, exclusion.participantAId));
  }

  const giverOrder = shuffle(uniqueParticipants, rng);
  const usedRecipients = new Set<string>();
  const assignments: SecretSantaDrawPair[] = [];

  function backtrack(giverIndex: number): boolean {
    if (giverIndex === giverOrder.length) return true;

    const giverParticipantId = giverOrder[giverIndex];
    const candidateRecipients = shuffle(uniqueParticipants, rng).filter(
      (recipientParticipantId) =>
        recipientParticipantId !== giverParticipantId &&
        !usedRecipients.has(recipientParticipantId) &&
        !blocked.has(exclusionKey(giverParticipantId, recipientParticipantId))
    );

    for (const recipientParticipantId of candidateRecipients) {
      usedRecipients.add(recipientParticipantId);
      assignments.push({ giverParticipantId, recipientParticipantId });
      if (backtrack(giverIndex + 1)) return true;
      assignments.pop();
      usedRecipients.delete(recipientParticipantId);
    }

    return false;
  }

  if (!backtrack(0)) throw new Error("SECRET_SANTA_DRAW_IMPOSSIBLE");
  return assignments;
}
