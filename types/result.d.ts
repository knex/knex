// This empty interface serves as a placeholder which userland code can augment to
// override result types.
//
// Currently only available result type which is overridable is Count, which defaults to
// number | string;
//
// Following example in userland code will alter this to be just number:
//
// declare module "knex/types/result" {
//     interface Registry {
//         Count: number;
//     }
// }
//
// Prior discussion: https://github.com/tgriesser/knex/issues/3247
export interface Registry {
    // We can't actually have default types here
    // because typescript's augmentation will not permit
    // overriding the type of a property already present.
    //
    // But the effective defaults are documented below:
    //
    // Count: number | string;
    //
    // Refer to Knex.Lookup type operator to see how the defaults
    // are actually specified.
}
