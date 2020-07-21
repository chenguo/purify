import { EitherAsync } from './EitherAsync'
import { Left, Right } from './Either'
import { Nothing, Just } from './Maybe'

describe('EitherAsync', () => {
  test('liftEither', () => {
    EitherAsync(async ({ liftEither }) => {
      const value: 5 = await liftEither(Right<5>(5))
    })
  })

  test('fromPromise', () => {
    EitherAsync(async ({ fromPromise }) => {
      const value: 5 = await fromPromise(Promise.resolve(Right<5>(5)))
    })
  })

  test('throwE', async () => {
    const ea = EitherAsync<string, number>(async ({ liftEither, throwE }) => {
      const value: 5 = await liftEither(Right<5>(5))
      throwE('Test')
      return value
    })

    expect(await ea.run()).toEqual(Left('Test'))
  })

  test('try/catch', async () => {
    const ea = EitherAsync<string, void>(async ({ fromPromise, throwE }) => {
      try {
        await fromPromise(Promise.reject('shouldnt show'))
      } catch {
        throwE('should show')
      }
    })

    expect(await ea.run()).toEqual(Left('should show'))
  })

  test('Promise compatibility', async () => {
    const result = await EitherAsync<string, never>(() => {
      throw 'Err'
    })

    const result2 = await EitherAsync<never, string>(async () => {
      return 'A'
    })

    expect(result).toEqual(Left('Err'))
    expect(result2).toEqual(Right('A'))
  })

  test('map', async () => {
    const newEitherAsync = EitherAsync(() => Promise.resolve(5)).map(
      (_) => 'val'
    )
    const newEitherAsync2 = EitherAsync(() => Promise.resolve(5))[
      'fantasy-land/map'
    ]((_) => 'val')

    expect(await newEitherAsync.run()).toEqual(Right('val'))
    expect(await newEitherAsync2.run()).toEqual(Right('val'))
  })

  test('map async', async () => {
    const newEitherAsync = EitherAsync(() => Promise.resolve(5)).map(
      async (_) => 'val'
    )
    const newEitherAsync2 = EitherAsync(() => Promise.resolve(5))[
      'fantasy-land/map'
    ](async (_) => 'val')

    expect(await newEitherAsync.run()).toEqual(Right('val'))
    expect(await newEitherAsync2.run()).toEqual(Right('val'))
  });

  test('mapLeft', async () => {
    const newEitherAsync = EitherAsync<number, never>(() =>
      Promise.reject(0)
    ).mapLeft((x) => x + 1)

    const newEitherAsync2 = EitherAsync<never, number>(() =>
      Promise.resolve(0)
    ).mapLeft((x) => x + 1)

    expect(await newEitherAsync.run()).toEqual(Left(1))
    expect(await newEitherAsync2.run()).toEqual(Right(0))
  })

  test('chain', async () => {
    const newEitherAsync = EitherAsync(() => Promise.resolve(5)).chain((_) =>
      EitherAsync(() => Promise.resolve('val'))
    )
    const newEitherAsync2 = EitherAsync(() => Promise.resolve(5))[
      'fantasy-land/chain'
    ]((_) => EitherAsync(() => Promise.resolve('val')))

    expect(await newEitherAsync.run()).toEqual(Right('val'))
    expect(await newEitherAsync2.run()).toEqual(Right('val'))
  })

  test('chain (with PromiseLike)', async () => {
    const newEitherAsync = EitherAsync(() => Promise.resolve(5)).chain((_) =>
      Promise.resolve(Right('val'))
    )
    const newEitherAsync2 = EitherAsync(() => Promise.resolve(5))[
      'fantasy-land/chain'
    ]((_) => Promise.resolve(Right('val')))

    expect(await newEitherAsync.run()).toEqual(Right('val'))
    expect(await newEitherAsync2.run()).toEqual(Right('val'))
  })

  test('chainLeft', async () => {
    const newEitherAsync = EitherAsync(() =>
      Promise.resolve(5)
    ).chainLeft((_) => EitherAsync(() => Promise.resolve(7)))
    const newEitherAsync2 = EitherAsync<number, number>(() =>
      Promise.reject(5)
    ).chainLeft((e) => EitherAsync(() => Promise.resolve(e + 1)))

    expect(await newEitherAsync.run()).toEqual(Right(5))
    expect(await newEitherAsync2.run()).toEqual(Right(6))
  })

  test('chainLeft (with PromiseLike)', async () => {
    const newEitherAsync = EitherAsync(() =>
      Promise.resolve(5)
    ).chainLeft((_) => Promise.resolve(Right(7)))
    const newEitherAsync2 = EitherAsync<number, number>(() =>
      Promise.reject(5)
    ).chainLeft((e) => Promise.resolve(Right(e + 1)))

    expect(await newEitherAsync.run()).toEqual(Right(5))
    expect(await newEitherAsync2.run()).toEqual(Right(6))
  })

  test('toMaybeAsync', async () => {
    const ma = EitherAsync(({ liftEither }) => liftEither(Left('123')))

    expect(await ma.toMaybeAsync().run()).toEqual(Nothing)

    const ma2 = EitherAsync(({ liftEither }) => liftEither(Right(5)))

    expect(await ma2.toMaybeAsync().run()).toEqual(Just(5))
  })

  test('swap', async () => {
    const eitherAsyncRight = EitherAsync(() => Promise.resolve(5))
    expect(await eitherAsyncRight.swap().run()).toEqual(Left(5))

    const eitherAsyncLeft = EitherAsync(async () => Promise.reject('fail'))
    expect(await eitherAsyncLeft.swap().run()).toEqual(Right('fail'))
  })

  describe('run', () => {
    it('resolves to Left if any of the async Eithers are Left', async () => {
      expect(
        await EitherAsync(({ fromPromise }) =>
          fromPromise(Promise.resolve(Left('Error')))
        ).run()
      ).toEqual(Left('Error'))
    })

    it('resolves to a Left with the rejected value if there is a rejected promise', async () => {
      expect(
        await EitherAsync<void, never>(({ fromPromise }) =>
          fromPromise(Promise.reject('Some error'))
        ).run()
      ).toEqual(Left('Some error'))
    })

    it('resolves to Left with an exception if there is an exception thrown', async () => {
      expect(
        await EitherAsync(() => {
          throw new Error('!')
        }).run()
      ).toEqual(Left(Error('!')))
    })

    it('resolve to Right if the promise resolves successfully', async () => {
      expect(
        await EitherAsync(({ fromPromise }) =>
          fromPromise(Promise.resolve(Right(5)))
        ).run()
      ).toEqual(Right(5))
    })
  })

  test('fromPromise static', async () => {
    expect(
      await EitherAsync.fromPromise(() => Promise.resolve(Right(5))).run()
    ).toEqual(Right(5))
    expect(
      await EitherAsync.fromPromise(() => Promise.reject(5)).run()
    ).toEqual(Left(5))
  })

  test('liftPromise static', async () => {
    expect(
      await EitherAsync.liftPromise(() => Promise.resolve(5)).run()
    ).toEqual(Right(5))
    expect(
      await EitherAsync.liftPromise(() => Promise.reject(5)).run()
    ).toEqual(Left(5))
  })

  test('liftEither static', async () => {
    expect(await EitherAsync.liftEither(Right(5)).run()).toEqual(Right(5))
    expect(await EitherAsync.liftEither(Left(5)).run()).toEqual(Left(5))
  })
})
