using CueFinder.Raffles.Interfaces;
using CueFinder.Raffles.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CueFinder.Raffles.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddRaffleServices(this IServiceCollection services)
    {
        services.AddScoped<IRaffleService, RaffleService>();
        return services;
    }
}
