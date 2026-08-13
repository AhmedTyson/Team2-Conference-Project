<?php

namespace App\Support\Constants;

final class CacheKeys
{
    const TRIP_ATTACHMENT = 'trip:attachment:{trip_id}:{item_type}:{item_id}';

    const TRIP_ITINERARY = 'trip:itinerary:{trip_id}';

    const WEATHER_LOCATION = 'weather:location:{lat}|{lng}';

    const WEATHER_FORECAST = 'weather:forecast:{lat}|{lng}';

    const AI_QUOTA_USER = 'ai:quota:{user_id}';

    const AI_QUOTA_GLOBAL = 'ai:quota:global';

    const CACHE_TAG_ANALYTICS = 'analytics';

    const DASHBOARD_ANALYTICS = 'dashboard:analytics';

    const REPORTS_PAGE = 'reports:page:{page}';

    const USER_UNREAD_NOTIFICATIONS = 'user:{user_id}:unread_notifications';

    const PAYMOB_WEBHOOK_PROCESSING = 'paymob:webhook:processing:{order_id}';

    const OPENSTREET_ATTRACTIONS = 'osm:attractions:ai:{lat}|{lng}|{type}|{radius}';

    const FLIGHT_SEARCH = 'flight:search:{origin}|{destination}|{date}';
}
