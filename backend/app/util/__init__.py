
import random


def sample(ratio, n):
    """
    ratio in [0, 100]
    n >= 0
    """
    if 0 >= n:
        return []
    
    return [i for i in range(n) if ratio >= random.randint(1, 100)]
