using CueFinder.Messages.Controllers;
using CueFinder.Messages.Hubs;
using CueFinder.Messages.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CueFinder.Messages.Extensions
{
    public static class MessageServiceCollectionExtensions
    {
        public static IServiceCollection AddMessageServices(this IServiceCollection services)
        {
            services.TryAddScoped<MessagesController>();
            services.AddScoped<IMessageService, MessageService>();
            return services;
        }
    }
}
