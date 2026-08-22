const recommendationReadiness = new Map<string, Promise<void>>();

export const trackRecommendationPersistence = (
  recommendationId: string,
  persistence: Promise<unknown>,
): void => {
  const ready = persistence.then(
    () => undefined,
    () => undefined,
  );
  recommendationReadiness.set(recommendationId, ready);

  void ready.finally(() => {
    if (recommendationReadiness.get(recommendationId) === ready) {
      recommendationReadiness.delete(recommendationId);
    }
  });
};

export const waitForRecommendationPersistence = async (
  recommendationId: string,
): Promise<void> => {
  await recommendationReadiness.get(recommendationId);
};
