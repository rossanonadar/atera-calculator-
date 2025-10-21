<?php
/**
 * Configuration merge and access helpers for Atera Compact Calculator.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
// Load local and remote configuration files.
function atera_compact_calculator_merge_config( array $local, array $remote ) {
    $merged = $local;
    $local_sliders  = isset( $local['sliders'] ) && is_array( $local['sliders'] ) ? $local['sliders'] : array();
    $remote_sliders = isset( $remote['sliders'] ) && is_array( $remote['sliders'] ) ? $remote['sliders'] : array();

    if ( ! empty( $remote_sliders ) ) {
        if ( empty( $local_sliders ) ) {
            $merged['sliders'] = $remote_sliders;
        } else {
            foreach ( $local_sliders as $index => $slider ) {
                $override = array();

                if ( isset( $slider['id'] ) ) {
                    foreach ( $remote_sliders as $candidate ) {
                        if ( isset( $candidate['id'] ) && $candidate['id'] === $slider['id'] ) {
                            $override = $candidate;
                            break;
                        }
                    }
                }

                if ( empty( $override ) && isset( $remote_sliders[ $index ] ) ) {
                    $override = $remote_sliders[ $index ];
                }

                if ( ! empty( $override ) && is_array( $override ) ) {
                    $merged['sliders'][ $index ] = array_merge( $slider, $override );
                }
            }

            if ( count( $remote_sliders ) > count( $local_sliders ) ) {
                $additional = array_slice( $remote_sliders, count( $local_sliders ) );
                foreach ( $additional as $extra_slider ) {
                    if ( is_array( $extra_slider ) ) {
                        $merged['sliders'][] = $extra_slider;
                    }
                }
            }
        }
    }

    // Merge other top-level keys from remote config.
    foreach ( $remote as $key => $value ) {
        if ( 'sliders' === $key ) {
            continue;
        }

        $merged[ $key ] = $value;
    }
    // Determine the prefix.
    if ( empty( $merged['prefix'] ) ) {
        if ( isset( $remote['prefix'] ) && '' !== (string) $remote['prefix'] ) {
            $merged['prefix'] = (string) $remote['prefix'];
        } elseif ( isset( $merged['sliders'] ) && is_array( $merged['sliders'] ) ) {
            foreach ( $merged['sliders'] as $slider_config ) {
                if ( isset( $slider_config['prefix'] ) && '' !== (string) $slider_config['prefix'] ) {
                    $merged['prefix'] = (string) $slider_config['prefix'];
                    break;
                }
            }
        }
    }

    // Default to '$' if still empty.
    if ( empty( $merged['prefix'] ) ) {
        $merged['prefix'] = '$';
    }
    // Determine the CTA href.
    if ( isset( $remote['ctaHref'] ) && '' !== (string) $remote['ctaHref'] ) {
        $merged['ctaHref'] = (string) $remote['ctaHref'];
    }

    return $merged;
}

// Load and cache the merged configuration.
function atera_compact_calculator_load_config() {
    $cache_key = 'atera_compact_calculator_config_v1';
    $cached    = get_transient( $cache_key );

    // Return cached config if available.
    if ( false !== $cached ) {
        return $cached;
    }

    $local  = atera_compact_calculator_load_local_config();
    $remote = atera_compact_calculator_load_remote_config();

    // Merge configurations based on availability.
    if ( is_array( $remote ) && ! is_wp_error( $remote ) ) {
        $base   = is_array( $local ) && ! is_wp_error( $local ) ? $local : array();
        $config = atera_compact_calculator_merge_config( $base, $remote );
    } elseif ( is_array( $local ) && ! is_wp_error( $local ) ) {
        $config = $local;
        if ( empty( $config['prefix'] ) ) {
            $config['prefix'] = '$';
        }
    } else {
        return is_wp_error( $remote ) ? $remote : $local;
    }

    // Cache the merged configuration for 1 hour.
    set_transient( $cache_key, $config, HOUR_IN_SECONDS );

    return $config;
}

// Get the default currency prefix.
function atera_compact_calculator_default_prefix() {
    $config = atera_compact_calculator_load_config();

    // Fallback to '$' if config loading fails.
    if ( is_wp_error( $config ) ) {
        return '$';
    }

    // Check for global prefix.
    if ( isset( $config['prefix'] ) && '' !== (string) $config['prefix'] ) {
        return (string) $config['prefix'];
    }
    // Check for slider-specific prefixes.
    if ( isset( $config['sliders'] ) && is_array( $config['sliders'] ) ) {
        foreach ( $config['sliders'] as $slider ) {
            if ( isset( $slider['prefix'] ) && '' !== (string) $slider['prefix'] ) {
                return (string) $slider['prefix'];
            }
        }
    }

    return '$';
}

// Get the CTA href from configuration or environment.
function atera_compact_calculator_cta_href() {
    $config = atera_compact_calculator_load_config();

    // Fallback to '# if config loading fails.
    if ( is_wp_error( $config ) ) {
        return '#';
    }
    // Check for CTA href in config.
    if ( isset( $config['ctaHref'] ) && '' !== (string) $config['ctaHref'] ) {
        return (string) $config['ctaHref'];
    }
    // Check for environment variable.
    $env = getenv( 'ATERA_CALC_CTA_HREF' );
    if ( ! empty( $env ) ) {
        return trim( $env );
    }

    // Check for defined constant.
    if ( defined( 'ATERA_CALC_CTA_HREF' ) ) {
        return (string) constant( 'ATERA_CALC_CTA_HREF' );
    }

    // Default fallback.
    return '#';
}
