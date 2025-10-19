<?php
/**
 * Configuration loading utilities for the Atera Compact Calculator block.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function atera_compact_calculator_asset_version( $relative_path ) {
    $absolute_path = plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . ltrim( $relative_path, '/' );

    if ( file_exists( $absolute_path ) ) {
        return filemtime( $absolute_path );
    }

    return '1.0.0';
}

function atera_compact_calculator_load_local_config() {
    $config_path = plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . 'calc-sliders.json';

    if ( ! file_exists( $config_path ) ) {
        return new WP_Error(
            'atera_calculator_missing_config',
            __( 'The calculator configuration could not be found.', 'atera' ),
            array( 'status' => 500 )
        );
    }

    if ( ! is_readable( $config_path ) ) {
        return new WP_Error(
            'atera_calculator_unreadable_config',
            __( 'The calculator configuration file is not readable.', 'atera' ),
            array( 'status' => 500 )
        );
    }

    $data = function_exists( 'wp_json_file_decode' )
        ? wp_json_file_decode( $config_path, array( 'associative' => true ) )
        : json_decode( file_get_contents( $config_path ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

    if ( null === $data || ! is_array( $data ) ) {
        return new WP_Error(
            'atera_calculator_invalid_config',
            __( 'The calculator configuration is invalid.', 'atera' ),
            array( 'status' => 500 )
        );
    }

    return $data;
}

function atera_compact_calculator_filter_remote_url( $url ) {
    if ( ! empty( $url ) ) {
        return $url;
    }

    $option = get_option( 'atera_compact_calculator_remote_url', '' );
    if ( ! empty( $option ) ) {
        return trim( $option );
    }

    $env = getenv( 'ATERA_CALC_REMOTE_CONFIG_URL' );
    if ( ! empty( $env ) ) {
        return trim( $env );
    }

    if ( defined( 'ATERA_CALC_REMOTE_CONFIG_URL' ) ) {
        return trim( (string) ATERA_CALC_REMOTE_CONFIG_URL );
    }

    return $url;
}
add_filter( 'atera_compact_calculator_remote_config_url', 'atera_compact_calculator_filter_remote_url', 5 );

function atera_compact_calculator_load_remote_config() {
    $remote_url = get_option( 'atera_compact_calculator_remote_url', '' );
    $remote_url = apply_filters( 'atera_compact_calculator_remote_config_url', $remote_url );

    if ( empty( $remote_url ) ) {
        return new WP_Error(
            'atera_calculator_remote_disabled',
            __( 'No remote configuration URL has been defined.', 'atera' ),
            array( 'status' => 404 )
        );
    }

    $response = wp_remote_get(
        $remote_url,
        array(
            'timeout' => 10,
            'headers' => array( 'Accept' => 'application/json' ),
        )
    );

    if ( is_wp_error( $response ) ) {
        return $response;
    }

    $code = wp_remote_retrieve_response_code( $response );
    if ( 200 !== (int) $code ) {
        return new WP_Error(
            'atera_calculator_remote_http_error',
            sprintf( __( 'Remote configuration returned HTTP %d.', 'atera' ), (int) $code ),
            array( 'status' => $code )
        );
    }

    $body = wp_remote_retrieve_body( $response );
    $data = json_decode( $body, true );

    if ( null === $data || ! is_array( $data ) ) {
        return new WP_Error(
            'atera_calculator_remote_invalid',
            __( 'The remote calculator configuration is invalid.', 'atera' ),
            array( 'status' => 500 )
        );
    }

    return $data;
}

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
