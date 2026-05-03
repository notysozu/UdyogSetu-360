from typing import List

from pydantic import BaseModel


class RecommendationResult(BaseModel):
    recommendations: List[str]
