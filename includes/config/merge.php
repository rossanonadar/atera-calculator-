<?php
/**
 * Configuration merge and access helpers for Atera Compact Calculator.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . 'includes/config/local.php';
require_once plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . 'includes/config/remote.php';
require_once plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . 'includes/config/asset.php';

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

    foreach ( $remote as $key => $value ) {
        if ( 'sliders' === $key ) {
            continue;
        }

        $merged[ $key ] = $value;
    }

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

    if ( empty( $merged['prefix'] ) ) {
        $merged['prefix'] = '$';
    }

    return $merged;
}

function atera_compact_calculator_load_config() {
    $cache_key = 'atera_compact_calculator_config_v1';
    $cached    = get_transient( $cache_key );

    if ( false !== $cached ) {
        return $cached;
    }

    $local  = atera_compact_calculator_load_local_config();
    $remote = atera_compact_calculator_load_remote_config();

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

    set_transient( $cache_key, $config, HOUR_IN_SECONDS );

    return $config;
}

function atera_compact_calculator_default_prefix() {
    $config = atera_compact_calculator_load_config();

    if ( is_wp_error( $config ) ) {
        return '$';
    }

    if ( isset( $config['prefix'] ) && '' !== (string) $config['prefix'] ) {
        return (string) $config['prefix'];
    }

    if ( isset( $config['sliders'] ) && is_array( $config['sliders'] ) ) {
        foreach ( $config['sliders'] as $slider ) {
            if ( isset( $slider['prefix'] ) && '' !== (string) $slider['prefix'] ) {
                return (string) $slider['prefix'];
            }
        }
    }

    return '$';
}
