# Second-Order Effects

Think multiple levels deep before implementing.

## The Thinking Chain

```
1st order: Direct result of your change
2nd order: What happens because of that result
3rd order: What happens because of the 2nd order effect
4th order: Systemic adaptations needed
```

## Example: Adding Caching

```
1st order: "Adding caching makes this endpoint faster"
2nd order: "Faster responses → users make more requests"
3rd order: "More requests → users retry more aggressively under load"
4th order: "Need circuit breakers and rate limiting"
```

## Example: Adding a Feature Flag

```
1st order: "Feature flag lets us control rollout"
2nd order: "Multiple code paths increase complexity"
3rd order: "Stale flags become permanent, confusing new devs"
4th order: "Need flag cleanup process and monitoring"
```

## Questions to Ask Before Every Change

1. **What depends on this?**
   - What code calls this function?
   - What systems consume this API?
   - What users rely on this behavior?

2. **What will this enable or break?**
   - What becomes possible that wasn't before?
   - What assumptions does this invalidate?

3. **How will users change behavior?**
   - Will they use it more? Less? Differently?
   - Will they work around limitations you introduce?

4. **What's the worst failure mode?**
   - If this breaks, what's the blast radius?
   - What's the recovery path?

5. **What happens at scale?**
   - If this succeeds, what happens when usage 10x?
   - What resources scale linearly? Exponentially?

## Common Second-Order Traps

| Change | Often-Missed Effect |
|--------|---------------------|
| Making something faster | Users do more of it |
| Adding validation | Breaks existing workflows |
| Changing defaults | Silent behavior change for existing users |
| Adding logging | Performance impact at scale |
| Improving error messages | Reveals internal implementation |
| Adding rate limiting | Breaks legitimate high-volume users |

## The Senior Difference

Juniors can name second-order effects if asked.

Seniors automatically consider them **before implementing**.

It's internalized, not a checklist.

## Practice Exercise

Before your next change, write down:
1. Three things that might happen because of this change
2. One thing users might do differently
3. One way this could fail that isn't obvious

Then verify after shipping.
